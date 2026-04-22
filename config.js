window.BENKO_CONFIG = {
  businessName: "Benko Tour",
  whatsappNumber: "573245065560",

  channels: {
    reservationApiUrl: "http://localhost:8787/api/reservations",
    orderApiUrl: "http://localhost:8787/api/orders",
    reservationApiToken: "",
    reservationEmail: "reservas@benkotour.com",
    enableWhatsAppFallback: true
  },

  payments: {
    wompi: {
      provider: "Wompi",
      checkoutEndpoint: "http://localhost:8787/api/payments/wompi/checkout",
      fallbackCheckoutUrl: ""
    },
    mercadopago: {
      provider: "Mercado Pago",
      preferenceEndpoint: "http://localhost:8787/api/payments/mercadopago/preference",
      fallbackCheckoutUrl: ""
    }
  }
};
