export function Table({ children, className = "" }) {
  return <table className={`w-full text-sm ${className}`}>{children}</table>;
}

export function THead({ children, className = "" }) {
  return <thead className={className}>{children}</thead>;
}

export function TBody({ children, className = "" }) {
  return <tbody className={className}>{children}</tbody>;
}

export function TR({ children, className = "" }) {
  return <tr className={className}>{children}</tr>;
}

export function TH({ children, className = "", ...props }) {
  return (
    <th className={`py-3 px-4 font-semibold text-slate-700 ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TD({ children, className = "", ...props }) {
  return (
    <td className={`py-3 px-4 text-slate-700 ${className}`} {...props}>
      {children}
    </td>
  );
}

