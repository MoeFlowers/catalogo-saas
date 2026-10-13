/** Foto del producto, o un espacio honesto con el código cuando la empresa todavía no la sube */
export function FotoProducto({ sku, url, nombre, grande = false }: { sku: string; url?: string | undefined; nombre?: string; grande?: boolean }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- las fotos vienen del almacenamiento S3 ya optimizadas a WebP
      <img src={url} alt={nombre ?? ""} loading="lazy" decoding="async" className="aspect-square w-full rounded-control bg-hundido object-cover" />
    );
  }
  return (
    <div className={`grid aspect-square w-full place-items-center rounded-control bg-hundido text-center ${grande ? "p-6" : "p-3"}`} role="img" aria-label="Producto sin foto">
      <div>
        <p className={`cifras font-semibold text-tenue ${grande ? "text-lg" : "text-sm"}`}>{sku}</p>
        <p className="text-xs text-tenue">Sin foto todavía</p>
      </div>
    </div>
  );
}

/** Iniciales de la empresa en su color, mientras sube su logo */
export function MarcaEmpresa({ nombre, tamano = 40 }: { nombre: string; tamano?: number }) {
  const iniciales = nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
  return (
    <span aria-hidden style={{ width: tamano, height: tamano, fontSize: tamano * 0.38 }} className="grid shrink-0 place-items-center rounded-control bg-marca font-bold text-marca-texto">
      {iniciales}
    </span>
  );
}
