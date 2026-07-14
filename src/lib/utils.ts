export const formatPrice = (price: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);

export const getColorStyle = (color: string): string => {
  const normalized = color.toLowerCase();
  
  // Black / Negro
  if (normalized.includes('black') || normalized.includes('negro') || normalized.includes('raven') || normalized.includes('obsidian') || normalized.includes('carbón')) 
    return "bg-gray-900";
  
  // White / Blanco
  if (normalized.includes('white') || normalized.includes('blanco') || normalized.includes('ecrù') || normalized.includes('cream') || normalized.includes('crema') || normalized.includes('marfil')) 
    return "bg-white border border-gray-200";
  
  // Grey / Gris
  if (normalized.includes('grey') || normalized.includes('gray') || normalized.includes('gris') || normalized.includes('slate') || normalized.includes('plata')) 
    return "bg-slate-400";
  
  // Red / Rojo
  if (normalized.includes('red') || normalized.includes('rojo') || normalized.includes('burdeos') || normalized.includes('granate') || normalized.includes('carmesí')) 
    return "bg-red-600";
  
  // Blue / Azul
  if (normalized.includes('blue') || normalized.includes('azul') || normalized.includes('navy') || normalized.includes('marino') || normalized.includes('celeste') || normalized.includes('cian')) 
    return normalized.includes('navy') || normalized.includes('marino') ? "bg-blue-900" : "bg-blue-500";
  
  // Green / Verde
  if (normalized.includes('green') || normalized.includes('verde') || normalized.includes('sage') || normalized.includes('esmeralda') || normalized.includes('oliva')) 
    return normalized.includes('sage') ? "bg-[#CCD5AE]" : "bg-emerald-600";
  
  // Yellow / Amarillo
  if (normalized.includes('yellow') || normalized.includes('amarillo') || normalized.includes('mostaza') || normalized.includes('oro')) 
    return "bg-yellow-400";
  
  // Pink / Rosa
  if (normalized.includes('pink') || normalized.includes('rosa') || normalized.includes('rose') || normalized.includes('fucsia')) 
    return normalized.includes('rose') || normalized.includes('pink') ? "bg-[#FEC5BB]" : "bg-pink-500";
  
  // Purple / Morado
  if (normalized.includes('purple') || normalized.includes('morado') || normalized.includes('violeta') || normalized.includes('lila')) 
    return "bg-purple-600";
  
  // Orange / Naranja
  if (normalized.includes('orange') || normalized.includes('naranja') || normalized.includes('coral')) 
    return "bg-orange-500";
  
  // Brown / Café
  if (normalized.includes('brown') || normalized.includes('café') || normalized.includes('marron') || normalized.includes('marrón') || normalized.includes('camel') || normalized.includes('sand') || normalized.includes('mocha') || normalized.includes('oat') || normalized.includes('canela')) 
    return normalized.includes('camel') || normalized.includes('sand') || normalized.includes('oat') ? "bg-[#DDBDF1]" : "bg-amber-800";

  return "bg-gray-200"; // Fallback
};
