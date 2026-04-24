const isLocalEnvironment = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const localApiBase = "http://localhost:8787/api";

window.BENKO_CONFIG = {
  businessName: "Benko Tour",
  whatsappNumber: "573245065560",

  channels: {
    reservationApiUrl: isLocalEnvironment ? `${localApiBase}/reservations` : "",
    orderApiUrl: isLocalEnvironment ? `${localApiBase}/orders` : "",
    accessApiUrl: isLocalEnvironment ? `${localApiBase}/access/users` : "",
    reservationApiToken: "",
    reservationEmail: "reservas@benkotour.com",
    enableWhatsAppFallback: true
  },

  payments: {
    wompi: {
      provider: "Wompi",
      checkoutEndpoint: isLocalEnvironment ? `${localApiBase}/payments/wompi/checkout` : "",
      fallbackCheckoutUrl: ""
    },
    mercadopago: {
      provider: "Mercado Pago",
      preferenceEndpoint: isLocalEnvironment ? `${localApiBase}/payments/mercadopago/preference` : "",
      fallbackCheckoutUrl: ""
    }
  }
};
