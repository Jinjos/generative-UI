import React from "react";
import { Chevron } from "@/components/ui/icons";

export interface Order {
  id: string;
  date: string;
  customer: string;
  items: string;
  paid: string;
  status: string;
  statusColor: string;
  total: string;
}

interface RecentOrdersProps {
  orders: Order[];
}

export const RecentOrders = ({ orders }: RecentOrdersProps) => (
  <div className="rounded-[8px] bg-[var(--color-unit)] p-6 shadow-card">
    <p className="text-lg font-medium text-[color:var(--color-primary)]">Recent orders</p>
    <div className="mt-4 overflow-hidden rounded-b-[8px]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--color-unit-2)] text-[color:var(--color-secondary)]">
          <tr>
            <th className="px-4 py-3 font-normal">No.</th>
            <th className="px-4 py-3 font-normal">Date/Time</th>
            <th className="px-4 py-3 font-normal">Customer</th>
            <th className="px-4 py-3 font-normal">Items</th>
            <th className="px-4 py-3 font-normal">Paid</th>
            <th className="px-4 py-3 font-normal">Status</th>
            <th className="px-4 py-3 font-normal">Total</th>
            <th className="px-4 py-3 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-[color:var(--color-stroke)]">
              <td className="px-4 py-3 text-[color:var(--color-primary)]">{order.id}</td>
              <td className="px-4 py-3 text-[color:var(--color-primary)]">{order.date}</td>
              <td className="px-4 py-3 text-[color:var(--color-primary)]">{order.customer}</td>
              <td className="px-4 py-3 text-[color:var(--color-primary)]">{order.items}</td>
              <td className="px-4 py-3 text-[color:var(--color-primary)]">{order.paid}</td>
              <td className="px-4 py-3 text-[color:var(--color-primary)]">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: order.statusColor }} />
                  {order.status}
                </span>
              </td>
              <td className="px-4 py-3 text-[color:var(--color-primary)]">{order.total}</td>
              <td className="px-4 py-3 text-right text-[color:var(--color-secondary)]">
                <Chevron className="h-4 w-4" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
