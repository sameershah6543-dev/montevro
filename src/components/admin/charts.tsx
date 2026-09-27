"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { compactPkr, pkr } from "@/lib/format";

/*
 * Chart palette — brand-derived, validated with the dataviz validator on #ffffff:
 * slots 1–3 pass all-pairs CVD (worst ΔE 13.2) and normal-vision (worst 24.0).
 * Slot 3 (aqua) is < 3:1 contrast → every chart here ships with a legend and a data table nearby.
 */
import { SERIES } from "./palette";
const GRID = "#ece8e1";
const AXIS_TEXT = "#8a8178";

type Row = Record<string, string | number>;
type SeriesDef = { key: string; name: string; color: string; kind: "bar" | "line"; money?: boolean };

function Legend({ series }: { series: SeriesDef[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
      {series.map((s) => (
        <li key={s.key} className="inline-flex items-center gap-2">
          {s.kind === "bar" ? (
            <span className="inline-block size-2.5 rounded-[2px]" style={{ background: s.color }} aria-hidden />
          ) : (
            <span className="inline-block h-[2px] w-4 rounded" style={{ background: s.color }} aria-hidden />
          )}
          {s.name}
        </li>
      ))}
    </ul>
  );
}

function TooltipBox({ active, payload, label, series }: TooltipContentProps<number, string> & { series: SeriesDef[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-40 border border-line bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-ink">{label}</p>
      {series.map((s) => {
        const p = payload.find((x) => x.dataKey === s.key);
        if (!p) return null;
        const v = Number(p.value ?? 0);
        return (
          <p key={s.key} className="flex items-center justify-between gap-4 text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full" style={{ background: s.color }} aria-hidden />
              {s.name}
            </span>
            <span className="tabular-nums text-ink">{s.money ? pkr(v) : v.toLocaleString()}</span>
          </p>
        );
      })}
    </div>
  );
}

/** Bars + lines sharing ONE y-axis (all series must share a unit). */
export function ComboChart({ data, series, height = 280, money = true }: { data: Row[]; series: SeriesDef[]; height?: number; money?: boolean }) {
  const hasNeg = data.some((d) => series.some((s) => Number(d[s.key]) < 0));
  const many = data.length > 16;
  return (
    <div>
      <Legend series={series} />
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap={many ? "20%" : "30%"}>
            <CartesianGrid vertical={false} stroke={GRID} strokeWidth={1} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: GRID }}
              tick={{ fill: AXIS_TEXT, fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: AXIS_TEXT, fontSize: 11 }}
              width={money ? 64 : 36}
              allowDecimals={false}
              tickFormatter={(v: number) => (money ? compactPkr(v).replace("Rs. ", "") : v.toLocaleString())}
            />
            {hasNeg && <ReferenceLine y={0} stroke="#c9c1b4" />}
            <Tooltip cursor={{ fill: "rgba(27,23,20,0.04)" }} content={(p) => <TooltipBox {...(p as TooltipContentProps<number, string>)} series={series} />} />
            {series.map((s) =>
              s.kind === "bar" ? (
                <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              ) : (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  type="monotone"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={data.length <= 16 ? { r: 4, fill: s.color, stroke: "#fff", strokeWidth: 2 } : false}
                  activeDot={{ r: 5, fill: s.color, stroke: "#fff", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              ),
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Ranked horizontal bars in plain HTML — one hue, value labels always visible. */
export function HBarList({
  rows,
  money = true,
  color = SERIES.s1,
  empty = "No data for this period",
}: {
  rows: { label: string; value: number; sub?: string; color?: string }[];
  money?: boolean;
  color?: string;
  empty?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length || rows.every((r) => r.value === 0)) return <p className="py-6 text-center text-sm text-stone">{empty}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} className="group" title={`${r.label}: ${money ? pkr(r.value) : r.value.toLocaleString()}${r.sub ? ` · ${r.sub}` : ""}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink-soft">{r.label}</span>
            <span className="shrink-0 tabular-nums text-ink">
              {money ? pkr(r.value) : r.value.toLocaleString()}
              {r.sub && <span className="ml-2 text-xs text-stone">{r.sub}</span>}
            </span>
          </div>
          <div className="h-2 w-full bg-[#f1ede6]">
            <div className="h-full rounded-r-[4px] transition-opacity group-hover:opacity-80" style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
