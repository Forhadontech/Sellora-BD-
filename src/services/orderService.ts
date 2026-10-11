import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import {
  Order,
  SubOrder,
  OrderStatus,
  ShippingAddress,
  PaymentMethod,
  PaymentStatus,
  OrderItem,
  SystemSettings
} from '../types';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { removeUndefined } from '../utils/firestoreUtils';

export async function getSettings(): Promise<SystemSettings> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'config'));
    if (snap.exists()) {
      return snap.data() as SystemSettings;
    }
    // Default fallback values if document not initialized yet
    return {
      deliveryFeeInsideDhaka: 80,
      deliveryFeeOutsideDhaka: 150,
      bkashNumber: '01711-234567',
      nagadNumber: '01911-765432'
    };
  } catch (error) {
    console.warn('Could not read settings config, using system defaults:', error);
    return {
      deliveryFeeInsideDhaka: 80,
      deliveryFeeOutsideDhaka: 150,
      bkashNumber: '01711-234567',
      nagadNumber: '01911-765432'
    };
  }
}

export interface PlaceOrderParams {
  customerId: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: { productId: string; quantity: number }[];
  paymentMethod: PaymentMethod;
  paymentTrxId?: string;
  idempotencyKey: string;
}

export async function placeOrder(params: PlaceOrderParams): Promise<{ orderId: string; orderNumber: string }> {
  const {
    customerId,
    customerName,
    customerPhone,
    shippingAddress,
    items,
    paymentMethod,
    paymentTrxId,
    idempotencyKey
  } = params;

  if (!items || items.length === 0) {
    throw new Error('Order must contain at least one item.');
  }

  // Check idempotency first to prevent duplicate submissions
  try {
    const existingQ = query(
      collection(db, 'orders'),
      where('idempotencyKey', '==', idempotencyKey)
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0].data() as Order;
      return { orderId: existingDoc.id, orderNumber: existingDoc.orderNumber };
    }
  } catch (e) {
    console.warn('Idempotency check query skipped or failed:', e);
  }

  // Fetch verified delivery fee configuration
  const settings = await getSettings();
  const isInsideDhaka = shippingAddress.district.toLowerCase() === 'dhaka';
  const deliveryFee = isInsideDhaka
    ? settings.deliveryFeeInsideDhaka
    : settings.deliveryFeeOutsideDhaka;

  const orderId = doc(collection(db, 'orders')).id;
  const timestamp = Date.now();
  const orderNumber = `SLR-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    await runTransaction(db, async (txn) => {
      // 1. Re-read all products & their stores in the transaction
      const productDocs: {
        ref: any;
        data: any;
        reqQty: number;
        storeData: any;
      }[] = [];

      for (const item of items) {
        const prodRef = doc(db, 'products', item.productId);
        const prodSnap = await txn.get(prodRef);

        if (!prodSnap.exists()) {
          throw new Error(`Product not found with ID ${item.productId}`);
        }

        const prodData = prodSnap.data();
        if (prodData.status !== 'published') {
          throw new Error(`Product "${prodData.nameEn}" is currently not available for purchase.`);
        }

        if (prodData.stock < item.quantity) {
          throw new Error(`Insufficient stock for "${prodData.nameEn}". Requested: ${item.quantity}, Available: ${prodData.stock}`);
        }

        // Verify store status
        const storeRef = doc(db, 'stores', prodData.storeId);
        const storeSnap = await txn.get(storeRef);
        if (!storeSnap.exists() || storeSnap.data().status !== 'approved') {
          throw new Error(`Store for "${prodData.nameEn}" is currently not active.`);
        }

        productDocs.push({
          ref: prodRef,
          data: prodData,
          reqQty: item.quantity,
          storeData: storeSnap.data()
        });
      }

      // 2. Decrement stock atomically
      for (const p of productDocs) {
        txn.update(p.ref, {
          stock: p.data.stock - p.reqQty,
          updatedAt: new Date().toISOString()
        });
      }

      // 3. Assemble validated items and calculate exact price from database
      let verifiedSubtotal = 0;
      const orderItems: OrderItem[] = [];

      // Group items by store for sub-orders
      const storeGroups: Record<string, {
        storeId: string;
        storeName: string;
        sellerId: string;
        items: OrderItem[];
        subtotal: number;
      }> = {};

      for (const p of productDocs) {
        const itemSubtotal = p.data.price * p.reqQty;
        verifiedSubtotal += itemSubtotal;

        const orderItem: OrderItem = {
          productId: p.data.id,
          nameEn: p.data.nameEn,
          nameBn: p.data.nameBn,
          price: p.data.price, // STRICT: Database price only
          quantity: p.reqQty,
          imageUrl: p.data.images?.[0] || '',
          subtotal: itemSubtotal,
          storeId: p.data.storeId,
          storeName: p.storeData.storeName || p.data.storeName || 'Store'
        };

        orderItems.push(orderItem);

        if (!storeGroups[p.data.storeId]) {
          storeGroups[p.data.storeId] = {
            storeId: p.data.storeId,
            storeName: p.storeData.storeName || 'Store',
            sellerId: p.data.ownerId,
            items: [],
            subtotal: 0
          };
        }
        storeGroups[p.data.storeId].items.push(orderItem);
        storeGroups[p.data.storeId].subtotal += itemSubtotal;
      }

      const totalAmount = verifiedSubtotal + deliveryFee;
      const paymentStatus: PaymentStatus = 'pending';
      const initialStatus: OrderStatus = 'pending';

      // 4. Clean shipping address and ensure no undefined keys exist
      const cleanShippingAddress: Record<string, any> = {
        fullName: shippingAddress.fullName?.trim() || '',
        phone: shippingAddress.phone?.trim() || '',
        address: shippingAddress.address?.trim() || '',
        district: shippingAddress.district || 'Dhaka',
      };
      if (shippingAddress.city && shippingAddress.city.trim()) {
        cleanShippingAddress.city = shippingAddress.city.trim();
      }
      if (shippingAddress.note && shippingAddress.note.trim()) {
        cleanShippingAddress.note = shippingAddress.note.trim();
      }

      // 5. Create Parent Order
      const parentOrderData: Record<string, any> = {
        id: orderId,
        orderNumber,
        customerId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        shippingAddress: cleanShippingAddress,
        items: orderItems,
        subtotal: verifiedSubtotal,
        deliveryFee,
        totalAmount,
        paymentMethod,
        paymentStatus,
        status: initialStatus,
        itemsCount: orderItems.reduce((sum, i) => sum + i.quantity, 0),
        idempotencyKey,
        createdAt: new Date().toISOString()
      };

      if (paymentTrxId && paymentTrxId.trim()) {
        parentOrderData.paymentTrxId = paymentTrxId.trim();
      }

      txn.set(doc(db, 'orders', orderId), removeUndefined(parentOrderData));

      // 6. Create Store Sub-Orders
      for (const sId of Object.keys(storeGroups)) {
        const group = storeGroups[sId];
        const subOrderId = doc(collection(db, 'subOrders')).id;
        const subOrderData: Record<string, any> = {
          id: subOrderId,
          orderId,
          orderNumber,
          storeId: group.storeId,
          storeName: group.storeName,
          sellerId: group.sellerId,
          customerId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          shippingAddress: cleanShippingAddress,
          items: group.items,
          subtotal: group.subtotal,
          status: initialStatus,
          createdAt: new Date().toISOString()
        };
        txn.set(doc(db, 'subOrders', subOrderId), removeUndefined(subOrderData));
      }
    });

    return { orderId, orderNumber };
  } catch (error) {
    console.error('Order transaction error:', error);
    handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
  }
}

export async function cancelOrder(orderId: string, callerId: string, isAdmin: boolean = false): Promise<void> {
  try {
    await runTransaction(db, async (txn) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await txn.get(orderRef);

      if (!orderSnap.exists()) {
        throw new Error('Order not found.');
      }

      const orderData = orderSnap.data() as Order;

      // Access control
      if (!isAdmin && orderData.customerId !== callerId) {
        throw new Error('Unauthorized: You can only cancel your own orders.');
      }

      // Valid cancellation state transition
      if (orderData.status !== 'pending' && orderData.status !== 'confirmed') {
        throw new Error(`Order cannot be cancelled in "${orderData.status}" status.`);
      }

      // Fetch sub-orders to restore stock
      const subOrdersQ = (!isAdmin && callerId)
        ? query(collection(db, 'subOrders'), where('orderId', '==', orderId), where('customerId', '==', callerId))
        : query(collection(db, 'subOrders'), where('orderId', '==', orderId));
      const subOrdersSnap = await getDocs(subOrdersQ);

      // CRITICAL: Execute all transaction reads BEFORE any writes
      const productUpdates: { ref: any; newStock: number }[] = [];
      for (const sDoc of subOrdersSnap.docs) {
        const subOrder = sDoc.data() as SubOrder;
        for (const item of subOrder.items) {
          const prodRef = doc(db, 'products', item.productId);
          const prodSnap = await txn.get(prodRef);
          if (prodSnap.exists()) {
            const currentStock = prodSnap.data().stock || 0;
            productUpdates.push({
              ref: prodRef,
              newStock: currentStock + item.quantity
            });
          }
        }
      }

      // NOW execute all writes
      for (const p of productUpdates) {
        txn.update(p.ref, {
          stock: p.newStock,
          updatedAt: new Date().toISOString()
        });
      }

      for (const sDoc of subOrdersSnap.docs) {
        txn.update(sDoc.ref, {
          status: 'cancelled',
          updatedAt: new Date().toISOString()
        });
      }

      // Update parent order status
      txn.update(orderRef, {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
}

export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', customerId)
    );
    const snap = await getDocs(q);
    const orders = snap.docs.map((d) => d.data() as Order);
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'orders');
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (!snap.exists()) return null;
    return snap.data() as Order;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `orders/${orderId}`);
  }
}

export async function getSubOrdersForOrder(orderId: string, customerId?: string): Promise<SubOrder[]> {
  try {
    const uid = customerId || auth.currentUser?.uid;
    // 1. If we have a user UID, try customer query first (ABAC compliant)
    if (uid) {
      try {
        const qCust = query(
          collection(db, 'subOrders'),
          where('orderId', '==', orderId),
          where('customerId', '==', uid)
        );
        const snap = await getDocs(qCust);
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as SubOrder);
        }
      } catch (err) {
        // Fall through to other queries
      }

      // 2. Try seller query (in case caller is seller)
      try {
        const qSeller = query(
          collection(db, 'subOrders'),
          where('orderId', '==', orderId),
          where('sellerId', '==', uid)
        );
        const snap = await getDocs(qSeller);
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as SubOrder);
        }
      } catch (err) {
        // Fall through
      }
    }

    // 3. Admin / fallback query
    const q = query(collection(db, 'subOrders'), where('orderId', '==', orderId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SubOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'subOrders');
  }
}

export async function getSellerSubOrders(sellerId: string): Promise<SubOrder[]> {
  try {
    const q = query(collection(db, 'subOrders'), where('sellerId', '==', sellerId));
    const snap = await getDocs(q);
    const orders = snap.docs.map((d) => d.data() as SubOrder);
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'subOrders');
  }
}

export async function updateSubOrderStatus(
  subOrderId: string,
  newStatus: OrderStatus,
  callerSellerId: string,
  isAdmin: boolean = false
): Promise<void> {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'processing', 'cancelled'],
    confirmed: ['pending', 'processing', 'shipped', 'cancelled'],
    processing: ['confirmed', 'shipped', 'delivered', 'cancelled'],
    shipped: ['processing', 'delivered', 'cancelled'],
    delivered: ['shipped'],
    cancelled: ['pending', 'confirmed']
  };

  try {
    const subRef = doc(db, 'subOrders', subOrderId);
    const subSnap = await getDoc(subRef);
    if (!subSnap.exists()) throw new Error('Sub-order not found.');

    const data = subSnap.data() as SubOrder;
    if (!isAdmin && data.sellerId !== callerSellerId) {
      throw new Error('Unauthorized: You can only update sub-orders for your store.');
    }

    if (!isAdmin) {
      const allowed = validTransitions[data.status] || [];
      if (!allowed.includes(newStatus)) {
        throw new Error(`Invalid status transition from "${data.status}" to "${newStatus}".`);
      }
    }

    // Update subOrder
    await updateDoc(subRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    // Sync parent order status if possible
    if (data.orderId) {
      try {
        const parentRef = doc(db, 'orders', data.orderId);
        await updateDoc(parentRef, {
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
      } catch (parentErr) {
        console.warn('Parent order status sync skipped:', parentErr);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `subOrders/${subOrderId}`);
  }
}
