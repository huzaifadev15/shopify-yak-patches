(function () {
  var pixelId = window.FINEYST_META_PIXEL_ID || '872158915250310';
  var context = window.FineystShopifyAnalytics || {};

  function toNumber(value) {
    var number = parseFloat(String(value || '0').replace(/[^0-9.-]/g, ''));
    return isNaN(number) ? 0 : number;
  }

  function generateEventId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return String(Date.now()) + '-' + Math.random().toString(36).slice(2, 11);
  }

  function loadPixel() {
    if (!pixelId) return;

    if (!window.fbq) {
      (function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    }

    if (!window.FineystMetaPixelInitialized && typeof window.fbq === 'function') {
      window.fbq('init', pixelId);
      window.FineystMetaPixelInitialized = true;
    }
  }

  function track(eventName, parameters, options) {
    loadPixel();
    if (typeof window.fbq !== 'function') return null;

    parameters = parameters || {};
    options = options || {};

    if (options.eventId) {
      window.fbq('track', eventName, parameters, { eventID: options.eventId });
    } else {
      window.fbq('track', eventName, parameters);
    }

    return options.eventId || null;
  }

  function trackPageView() {
    track('PageView', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname,
      page_type: context.page_type || ''
    });
  }

  function trackViewContent() {
    if (!context.product) return;

    track('ViewContent', {
      content_ids: [String(context.product.variant_id || context.product.id || '')],
      content_name: context.product.title || '',
      content_type: 'product',
      content_category: context.product.type || 'Patches',
      currency: context.currency || 'USD',
      value: toNumber(context.product.price)
    });
  }

  function trackLead(data) {
    data = data || {};

    var product = context.product || {};
    var eventId = data.eventId || data.event_id || generateEventId();
    var value = toNumber(data.value || data.subTotal || data.total || 0);

    return track('Lead', {
      content_name: data.content_name || data.product_name || product.title || 'Quote Request',
      content_category: data.content_category || data.patch_type || data.patchType || product.type || 'Patches',
      content_type: 'product',
      content_ids: [String(data.variant_id || data.product_id || product.variant_id || product.id || '')],
      currency: data.currency || context.currency || 'USD',
      value: value,
      quantity: parseInt(data.quantity, 10) || 1,
      status: 'submitted',
      form_name: data.form_name || 'category_quote_form',
      page_path: data.page_path || window.location.pathname,
      size: data.size || '',
      schedule: data.schedule || '',
      patch_type: data.patch_type || data.patchType || '',
      shape: data.shape || '',
      backing: data.backing || '',
      border: data.border || '',
      colors: data.colors || data.color || ''
    }, { eventId: eventId });
  }

  window.FineystMeta = {
    pixelId: pixelId,
    generateEventId: generateEventId,
    track: track,
    trackPageView: trackPageView,
    trackViewContent: trackViewContent,
    trackLead: trackLead
  };

  loadPixel();
  trackPageView();
  trackViewContent();
})();
