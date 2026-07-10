"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
            页面出错了
          </h1>
          <pre
            style={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              padding: "1rem",
              fontSize: "0.8rem",
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {error.message}
            {error.stack ? "\n\n" + error.stack : ""}
          </pre>
          <button
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: "#3f3f46",
              color: "#fafafa",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
