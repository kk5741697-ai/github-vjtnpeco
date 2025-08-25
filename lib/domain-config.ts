export interface DomainConfig {
  host: string
  name: string
  category: string
  primaryColor: string
  logo: string
  enabledCategories: string[]
  seoDefaults: {
    title: string
    description: string
    keywords: string[]
  }
}

export const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  "pixoratools.com": {
    host: "pixoratools.com",
    name: "PixoraTools",
    category: "all",
    primaryColor: "#164e63",
    logo: "/logos/pixora-tools.svg",
    enabledCategories: ["PDF", "IMAGE", "QR_BARCODE", "CODE_DEV", "SEO", "NETWORK", "UTILITIES", "CONVERTERS"],
    seoDefaults: {
      title: "PixoraTools - Professional Online Tools Platform",
      description:
        "Access 300+ professional web tools including PDF, image, QR, code, SEO, and utility tools. Fast, secure, and free to use.",
      keywords: ["web tools", "online tools", "PDF tools", "image tools", "QR generator", "code formatter"],
    },
  },
  "pixorapdf.com": {
    host: "pixorapdf.com",
    name: "PixoraPDF",
    category: "pdf",
    primaryColor: "#dc2626",
    logo: "/logos/pixora-pdf.svg",
    enabledCategories: ["PDF"],
    seoDefaults: {
      title: "PixoraPDF - Professional PDF Tools Online",
      description: "Merge, split, compress, convert, and edit PDF files online. Fast, secure, and free PDF tools.",
      keywords: ["PDF tools", "merge PDF", "split PDF", "compress PDF", "PDF converter"],
    },
  },
  "pixoraimg.com": {
    host: "pixoraimg.com",
    name: "PixoraIMG",
    category: "image",
    primaryColor: "#7c3aed",
    logo: "/logos/pixora-img.svg",
    enabledCategories: ["IMAGE"],
    seoDefaults: {
      title: "PixoraIMG - Professional Image Tools Online",
      description: "Resize, compress, convert, and edit images online. Support for JPG, PNG, WebP, AVIF, and more.",
      keywords: ["image tools", "resize image", "compress image", "image converter", "photo editor"],
    },
  },
  "pixoraqrcode.com": {
    host: "pixoraqrcode.com",
    name: "PixoraQRCode",
    category: "qr",
    primaryColor: "#059669",
    logo: "/logos/pixora-qr.svg",
    enabledCategories: ["QR_BARCODE"],
    seoDefaults: {
      title: "PixoraQRCode - QR Code & Barcode Generator",
      description: "Generate custom QR codes and barcodes with logos, colors, and tracking. Bulk generation supported.",
      keywords: ["QR code generator", "barcode generator", "custom QR codes", "QR scanner"],
    },
  },
  "pixoracode.com": {
    host: "pixoracode.com",
    name: "PixoraCode",
    category: "code",
    primaryColor: "#ea580c",
    logo: "/logos/pixora-code.svg",
    enabledCategories: ["CODE_DEV"],
    seoDefaults: {
      title: "PixoraCode - Code Formatting & Development Tools",
      description:
        "Format, beautify, minify, and validate JSON, HTML, CSS, JavaScript, and more. Developer tools online.",
      keywords: ["code formatter", "JSON beautifier", "HTML formatter", "CSS minifier", "developer tools"],
    },
  },
  "pixoraseo.com": {
    host: "pixoraseo.com",
    name: "PixoraSEO",
    category: "seo",
    primaryColor: "#0891b2",
    logo: "/logos/pixora-seo.svg",
    enabledCategories: ["SEO"],
    seoDefaults: {
      title: "PixoraSEO - SEO Analysis & Optimization Tools",
      description: "Analyze, optimize, and monitor your website SEO. Meta tag generator, sitemap creator, and more.",
      keywords: ["SEO tools", "meta tag generator", "SEO analysis", "sitemap generator", "SEO optimization"],
    },
  },
  "pixoranet.com": {
    host: "pixoranet.com",
    name: "PixoraNet",
    category: "network",
    primaryColor: "#7c2d12",
    logo: "/logos/pixora-net.svg",
    enabledCategories: ["NETWORK"],
    seoDefaults: {
      title: "PixoraNet - Network & System Tools",
      description: "Network analysis, SSL checker, IP lookup, and system diagnostic tools online.",
      keywords: ["network tools", "SSL checker", "IP lookup", "DNS tools", "network analysis"],
    },
  },
  "pixorautilities.com": {
    host: "pixorautilities.com",
    name: "PixoraUtilities",
    category: "utilities",
    primaryColor: "#4338ca",
    logo: "/logos/pixora-utilities.svg",
    enabledCategories: ["UTILITIES", "CONVERTERS"],
    seoDefaults: {
      title: "PixoraUtilities - General Purpose Online Tools",
      description: "Unit converters, calculators, generators, and utility tools for everyday use.",
      keywords: ["utility tools", "unit converter", "calculator", "password generator", "color picker"],
    },
  },
}

export function getDomainConfig(host: string): DomainConfig {
  // Remove port for local development
  const cleanHost = host.split(":")[0]

  // Default to global domain for localhost and unknown hosts
  if (cleanHost === "localhost" || !DOMAIN_CONFIGS[cleanHost]) {
    return DOMAIN_CONFIGS["pixoratools.com"]
  }

  return DOMAIN_CONFIGS[cleanHost]
}

export function isGlobalDomain(host: string): boolean {
  const cleanHost = host.split(":")[0]
  return cleanHost === "localhost" || cleanHost === "pixoratools.com"
}
