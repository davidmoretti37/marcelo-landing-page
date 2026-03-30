"use client";

import type { Aircraft } from "@/lib/showroom/types";

interface InventoryTableProps {
  aircraft: Aircraft[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatPrice(pricing: Aircraft["pricing"]): string {
  if (!pricing.showPrice) return "Price on Request";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(pricing.askingPrice);
}

const statusConfig: Record<
  Aircraft["status"],
  { label: string; color: string }
> = {
  available: { label: "Available", color: "#34d399" },
  under_contract: { label: "Under Contract", color: "var(--sr-gold)" },
  sold: { label: "Sold", color: "var(--sr-text-dim)" },
};

export default function InventoryTable({
  aircraft,
  onEdit,
  onDelete,
}: InventoryTableProps) {
  const sorted = [...aircraft].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div
        style={{
          padding: "80px 24px",
          textAlign: "center",
          background: "var(--sr-surface)",
          border: "1px solid var(--sr-border)",
        }}
      >
        <p
          style={{
            fontSize: "15px",
            color: "var(--sr-text-muted)",
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            marginBottom: "8px",
          }}
        >
          No aircraft in inventory
        </p>
        <p
          style={{
            fontSize: "12px",
            color: "var(--sr-text-dim)",
            fontFamily: "var(--font-inter), system-ui, sans-serif",
          }}
        >
          Click &quot;Add Aircraft&quot; above to add your first listing
        </p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "var(--font-inter), system-ui, sans-serif",
        }}
      >
        <thead>
          <tr>
            {["", "Aircraft", "Category", "Year", "Status", "Price", ""].map(
              (header, i) => (
                <th
                  key={i}
                  style={{
                    padding: "12px 16px",
                    fontSize: "10px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "var(--sr-text-dim)",
                    textAlign: "left",
                    borderBottom: "1px solid var(--sr-border)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {header}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((ac) => {
            const status = statusConfig[ac.status];
            const thumb = ac.photos[0]?.url;

            return (
              <tr
                key={ac.id}
                style={{
                  borderBottom: "1px solid var(--sr-border)",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--sr-surface-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Thumbnail */}
                <td style={{ padding: "10px 16px", width: "60px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "36px",
                      background: "var(--sr-bg)",
                      border: "1px solid var(--sr-border)",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={ac.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--sr-text-dim)",
                          fontFamily: "var(--font-inter), system-ui, sans-serif",
                        }}
                      >
                        --
                      </span>
                    )}
                  </div>
                </td>

                {/* Name */}
                <td
                  style={{
                    padding: "10px 16px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--sr-text)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {ac.name}
                </td>

                {/* Category */}
                <td
                  style={{
                    padding: "10px 16px",
                    fontSize: "12px",
                    color: "var(--sr-text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {ac.category}
                </td>

                {/* Year */}
                <td
                  style={{
                    padding: "10px 16px",
                    fontSize: "12px",
                    color: "var(--sr-text-muted)",
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                  }}
                >
                  {ac.year}
                </td>

                {/* Status badge */}
                <td style={{ padding: "10px 16px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "11px",
                      color: status.color,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: status.color,
                        flexShrink: 0,
                      }}
                    />
                    {status.label}
                  </span>
                </td>

                {/* Price */}
                <td
                  style={{
                    padding: "10px 16px",
                    fontSize: "12px",
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    color: ac.pricing.showPrice
                      ? "var(--sr-gold-light)"
                      : "var(--sr-text-dim)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatPrice(ac.pricing)}
                </td>

                {/* Actions */}
                <td
                  style={{
                    padding: "10px 16px",
                    whiteSpace: "nowrap",
                    textAlign: "right",
                  }}
                >
                  <button
                    onClick={() => onEdit(ac.id)}
                    style={{
                      padding: "5px 14px",
                      fontSize: "11px",
                      fontWeight: 500,
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      background: "transparent",
                      border: "1px solid var(--sr-border)",
                      color: "var(--sr-text-muted)",
                      cursor: "pointer",
                      marginRight: "8px",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--sr-gold-dim)";
                      e.currentTarget.style.color = "var(--sr-gold-light)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--sr-border)";
                      e.currentTarget.style.color = "var(--sr-text-muted)";
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete "${ac.name}"? This cannot be undone.`
                        )
                      ) {
                        onDelete(ac.id);
                      }
                    }}
                    style={{
                      padding: "5px 14px",
                      fontSize: "11px",
                      fontWeight: 500,
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      background: "transparent",
                      border: "1px solid var(--sr-border)",
                      color: "var(--sr-text-dim)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(220, 80, 80, 0.5)";
                      e.currentTarget.style.color = "rgba(220, 80, 80, 0.9)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--sr-border)";
                      e.currentTarget.style.color = "var(--sr-text-dim)";
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
