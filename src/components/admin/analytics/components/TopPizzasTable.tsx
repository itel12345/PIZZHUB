// src/components/admin/analytics/components/TopPizzasTable.tsx

import type { TopPizzaStat } from "@/lib/analytics";
import styles from "./TopPizzasTable.module.css";

interface TopPizzasTableProps {
  pizzas: TopPizzaStat[];
}

export default function TopPizzasTable({ pizzas }: TopPizzasTableProps) {
  return (
    <div className={styles.wrap}>
      <h3 className={styles.heading}>Top pizzas</h3>

      {pizzas.length === 0 ? (
        <div className={styles.empty}>
          <p>No confirmed sales yet.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Pizza</th>
                <th scope="col">Units sold</th>
                <th scope="col">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {pizzas.map((pizza) => (
                <tr key={pizza.pizzaId}>
                  <td data-label="Pizza">{pizza.name}</td>
                  <td data-label="Units sold">{pizza.unitsSold}</td>
                  <td data-label="Revenue">GHS {pizza.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}