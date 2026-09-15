import { type ReactNode } from "react";

export function Table({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export const numberText = (value: number | null | undefined) => value?.toPrecision(3) ?? "—";
