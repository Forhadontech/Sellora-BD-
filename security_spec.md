# SELLORA Security Specification & Test Invariants

## 1. Data Invariants
1. **User Identity & Role Invariance**: A user can never modify their own `role` or `status` fields, nor impersonate another user UID. The `role` on registration must default to "customer". Admin rights are never self-granted.
2. **Store Application Invariance**: A store's initial status must be "pending". Users cannot create stores for other UIDs. Only administrators can alter `status` (approve, reject, suspend) or set `rejectionReason`.
3. **Seller Store Ownership**: Sellers can only update permitted store metadata fields on their own store (`storeName`, `description`, `contactPhone`, `businessLocation`, `district`, `logoUrl`, `coverUrl`) and never the `ownerId` or `status`.
4. **Product Ownership & Store Integrity**: A product must reference a valid store owned by the authenticated seller. Only sellers owning the store can create or edit their products. Products can only be published if the store is approved.
5. **Admin Product Controls**: Only admins can set `isFeatured` or unpublish another seller's product with an `unpublishReason`.
6. **Order Privacy**: Customers can only read their own orders (`customerId == request.auth.uid`). Sellers can only read sub-orders where `sellerId == request.auth.uid`. Admins can read all orders and sub-orders.
7. **Order Creation & Financial Invariance**: Direct client writes to `/orders` or `/subOrders` must be forbidden or restricted through server transactions that validate stock, prices, and idempotency.
8. **Settings Immutability**: Platform settings (`/settings/config`) can only be modified by system administrators.

---

## 2. The "Dirty Dozen" Payloads (Must be Rejected with PERMISSION_DENIED)

1. **Payload 1: Role Escalation on Profile Update**
   A customer tries to update their user profile document `users/{uid}` with `role: "admin"`.
   *Target*: `users/user123` -> `{ role: "admin" }` -> **REJECTED**

2. **Payload 2: Self-Approval of Store Application**
   A seller submits a store creation with `status: "approved"` to bypass admin moderation.
   *Target*: `stores/store123` -> `{ ownerId: "user123", storeName: "Apex Store", status: "approved" }` -> **REJECTED**

3. **Payload 3: Store Hijacking / Owner ID Switch**
   A user attempts to change `ownerId` of an existing store to take ownership.
   *Target*: `stores/store123` -> `{ ownerId: "attackerUid" }` -> **REJECTED**

4. **Payload 4: Cross-Seller Product Modification**
   Seller B attempts to update or delete a product owned by Seller A.
   *Target*: `products/prodA` -> `{ price: 10 }` as Seller B -> **REJECTED**

5. **Payload 5: Self-Featuring Product Bypass**
   A seller attempts to set `isFeatured: true` on their own product.
   *Target*: `products/prodA` -> `{ isFeatured: true }` -> **REJECTED**

6. **Payload 6: Negative Stock Injection**
   A seller attempts to create a product with negative stock or negative price.
   *Target*: `products/prodA` -> `{ stock: -10, price: -50 }` -> **REJECTED**

7. **Payload 7: Unauthorized Order Status Manipulation by Customer**
   A customer attempts to update an order status from "shipped" to "delivered" or from "delivered" to "cancelled".
   *Target*: `orders/ord1` -> `{ status: "cancelled" }` -> **REJECTED**

8. **Payload 8: Snooping Another Customer's Order**
   Customer B attempts to `get` or `list` orders belonging to Customer A.
   *Target*: `orders/ordCustomerA` as Customer B -> **REJECTED**

9. **Payload 9: Snooping Another Seller's Sub-Order**
   Seller B attempts to read sub-orders containing Seller A's products and revenue.
   *Target*: `subOrders/subOrderSellerA` as Seller B -> **REJECTED**

10. **Payload 10: Non-Admin Modifying Delivery Fees**
    A regular user or seller attempts to update `/settings/config` with `deliveryFeeInsideDhaka: 0`.
    *Target*: `settings/config` -> `{ deliveryFeeInsideDhaka: 0 }` -> **REJECTED**

11. **Payload 11: Ghost Field Injection (Shadow Update)**
    A user attempts to add an un-modeled field `superAdminOverride: true` to a profile or store.
    *Target*: `users/user123` -> `{ superAdminOverride: true }` -> **REJECTED**

12. **Payload 12: Unauthenticated / Unverified Write Attempt**
    An unauthenticated guest or unverified client attempts to write to `/products` or `/stores`.
    *Target*: `products/newProd` without auth -> **REJECTED**
