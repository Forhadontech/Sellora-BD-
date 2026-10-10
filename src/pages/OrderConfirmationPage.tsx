import React, { useEffect, useState } from 'react';
import { useLanguage } from '../locales/LanguageContext';
import { Order, SubOrder } from '../types';
import { getOrderById, getSubOrdersForOrder } from '../services/orderService';
import { formatBDT, formatDate } from '../utils/formatters';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { CheckCircle2, Package, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

interface OrderConfirmationPageProps {
  orderId: string;
  onNavigate: (route: string, param?: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  orderId,
  onNavigate,
}) => {
  const { t, isBn } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const ord = await getOrderById(orderId);
        setOrder(ord);
        if (ord) {
          const subs = await getSubOrdersForOrder(orderId, ord.customerId);
          setSubOrders(subs || []);
        }
      } catch (e) {
        console.error('Error fetching order:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  if (loading) return <Loader text={t('loading')} />;

  if (!order) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Order not found</h2>
        <Button variant="primary" onClick={() => onNavigate('products')}>
          {t('backToShopping')}
        </Button>
      </div>
    );
  }

  const isManualPayment = order.paymentMethod === 'bkash' || order.paymentMethod === 'nagad';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Success banner */}
      <div className="text-center space-y-3 bg-white p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {t('orderPlacedSuccess')}
        </h1>
        <p className="text-sm text-slate-600">
          {t('orderNumber')}: <span className="font-bold text-emerald-900">{order.orderNumber}</span>
        </p>

        {isManualPayment && order.paymentStatus === 'pending' && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium mt-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>
              {isBn
                ? 'পেমেন্ট ট্রানজেকশন আইডি যাচাই অপেক্ষমান। এডমিন যাচাই শেষে নিশ্চিত করবেন।'
                : 'Payment TrxID is awaiting administrative verification.'}
            </span>
          </div>
        )}
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 text-xs">
          <div>
            <span className="text-slate-500 block">{t('orderDate')}</span>
            <span className="font-semibold text-slate-900">
              {formatDate(order.createdAt, isBn)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">{t('paymentMethod')}</span>
            <span className="font-semibold text-slate-900 uppercase">
              {order.paymentMethod} {order.paymentTrxId ? `(TrxID: ${order.paymentTrxId})` : ''}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">{t('orderStatus')}</span>
            <span className="font-semibold text-emerald-800 capitalize">
              {order.status}
            </span>
          </div>
        </div>

        {/* Sub Orders (Store breakdown) */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            {t('orderItems')}
          </h3>
          {subOrders.map((sub) => (
            <div key={sub.id} className="p-4 bg-slate-50 rounded-lg space-y-3 border border-slate-200/80">
              <div className="text-xs font-semibold text-slate-800">
                {t('soldBy')} <span className="text-emerald-900">{sub.storeName}</span>
              </div>
              <div className="space-y-2">
                {sub.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs text-slate-700">
                    <span className="truncate max-w-xs">
                      {isBn ? (item.nameBn || item.nameEn) : item.nameEn} &times; {item.quantity}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-900">
                      {formatBDT(item.subtotal, isBn)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Totals */}
        <div className="space-y-2 pt-4 border-t border-slate-200 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>{t('subtotal')}</span>
            <span className="font-semibold tabular-nums text-slate-900">
              {formatBDT(order.subtotal, isBn)}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>{t('deliveryFee')}</span>
            <span className="font-semibold tabular-nums text-slate-900">
              {formatBDT(order.deliveryFee, isBn)}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
            <span>{t('total')}</span>
            <span className="text-emerald-900 tabular-nums">
              {formatBDT(order.totalAmount, isBn)}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          variant="primary"
          onClick={() => onNavigate('account')}
          icon={<Package className="w-4 h-4" />}
        >
          {t('myAccount')}
        </Button>
        <Button
          variant="outline"
          onClick={() => onNavigate('products')}
        >
          {t('backToShopping')}
        </Button>
      </div>
    </div>
  );
};
