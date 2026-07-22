(function () {
  window.dataLayer = window.dataLayer || [];

  var context = window.FineystShopifyAnalytics || {};
  var storage = window.sessionStorage;
  var quoteIdentityStorageKey = 'fineyst_quote_lead_identity';
  var quoteIdentityCookieName = 'fineyst_quote_lead_identity';

  function toNumber(value) {
    var number = parseFloat(String(value || '0').replace(/[^0-9.-]/g, ''));
    return isNaN(number) ? 0 : number;
  }

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function normalizePhone(value) {
    return String(value || '')
      .replace(/[^\d+]/g, '')
      .replace(/^\+/, '');
  }

  function safeParseJSON(value) {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function safeGetLocalStorage(key) {
    try {
      return window.localStorage ? window.localStorage.getItem(key) : null;
    } catch (error) {
      return null;
    }
  }

  function safeSetLocalStorage(key, value) {
    try {
      if (window.localStorage) window.localStorage.setItem(key, value);
    } catch (error) {}
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }

  function setCookie(name, value) {
    var maxAge = 60 * 60 * 24 * 365;
    document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; max-age=' + maxAge + '; samesite=lax';
  }

  function readQuoteIdentity() {
    var stored = safeParseJSON(safeGetLocalStorage(quoteIdentityStorageKey));
    if (stored) return stored;
    return safeParseJSON(getCookie(quoteIdentityCookieName));
  }

  function saveQuoteIdentity(identity) {
    if (!identity) return;
    var payload = JSON.stringify({
      email: normalizeEmail(identity.email),
      phone: normalizePhone(identity.phone),
      saved_at: Date.now()
    });

    safeSetLocalStorage(quoteIdentityStorageKey, payload);
    setCookie(quoteIdentityCookieName, payload);
  }

  function matchesStoredIdentity(identity) {
    var stored = readQuoteIdentity();
    if (!stored) return false;

    var email = normalizeEmail(identity && identity.email);
    var phone = normalizePhone(identity && identity.phone);

    if (!email && !phone) return false;

    return (
      (email && stored.email && email === normalizeEmail(stored.email)) ||
      (phone && stored.phone && phone === normalizePhone(stored.phone))
    );
  }

  function push(eventName, payload, isEcommerce) {
    var eventData = { event: eventName };
    if (payload) {
      if (isEcommerce) {
        eventData.ecommerce = payload;
      } else {
        Object.keys(payload).forEach(function (key) {
          eventData[key] = payload[key];
        });
      }
    }

    window.dataLayer.push(eventData);

    if (window.gtag && payload) {
      window.gtag('event', eventName, payload);
    }
  }

  function trackPageView() {
    push('page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname,
      page_type: context.page_type || ''
    }, false);
  }

  function trackViewItem() {
    if (!context.product) return;

    push('view_item', {
      currency: context.currency || 'USD',
      value: toNumber(context.product.price),
      items: [{
        item_id: String(context.product.id || ''),
        item_name: context.product.title || '',
        item_category: context.product.type || 'Patches',
        item_variant: context.product.variant_title || '',
        price: toNumber(context.product.price),
        quantity: 1
      }]
    }, true);
  }

  function trackAddToCart(item) {
    if (!item) return;

    push('add_to_cart', {
      currency: context.currency || item.currency || 'USD',
      value: toNumber(item.price) * (parseInt(item.quantity, 10) || 1),
      items: [{
        item_id: String(item.id || item.variant_id || ''),
        item_name: item.name || item.title || '',
        item_category: item.category || item.product_type || 'Patches',
        item_variant: item.variant || item.variant_title || '',
        price: toNumber(item.price),
        quantity: parseInt(item.quantity, 10) || 1
      }]
    }, true);
  }

  function trackBeginCheckout(cart) {
    cart = cart || context.cart;
    if (!cart || !cart.items || !cart.items.length) return;

    var now = Date.now();
    var lastCheckoutTime = storage && storage.getItem('last-checkout-time');
    if (lastCheckoutTime && now - parseInt(lastCheckoutTime, 10) < 5 * 60 * 1000) return;

    push('begin_checkout', {
      currency: context.currency || cart.currency || 'USD',
      value: toNumber(cart.value),
      items: cart.items.map(function (item) {
        return {
          item_id: String(item.id || ''),
          item_name: item.name || '',
          item_category: item.category || 'Patches',
          item_variant: item.variant || '',
          price: toNumber(item.price),
          quantity: parseInt(item.quantity, 10) || 1
        };
      })
    }, true);

    if (storage) storage.setItem('last-checkout-time', String(now));
  }

  function compactSize(value) {
    return String(value || '')
      .replace(/"/g, '')
      .replace(/\s*x\s*/gi, 'x')
      .replace(/\s+/g, '')
      .trim();
  }

  function normalizePatchType(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/^custom-/, '')
      .replace(/-patches.*$/, '')
      .replace(/-+/g, '_')
      .trim();
  }

  function trackQuoteRequestSubmitted(data) {
    data = data || {};

    var eventId = data.event_id || data.eventId || (
      window.FineystMeta && typeof window.FineystMeta.generateEventId === 'function'
        ? window.FineystMeta.generateEventId()
        : String(Date.now()) + '-' + Math.random().toString(36).slice(2, 11)
    );
    var currentIdentity = {
      email: data.email || '',
      phone: data.phone || data.phoneNumber || ''
    };

    if (matchesStoredIdentity(currentIdentity)) {
      return false;
    }

    saveQuoteIdentity(currentIdentity);

    push('category_quote_request_submitted', {
      eventModel: {
        event_id: eventId,
        form_type: 'category_quote_request',
        form_name: data.form_name || 'category_quote_form',
        user_email: data.email || null,
        user_phone: data.phone || data.phoneNumber || null,
        user_name: data.name || data.customerName || null,
        patch_type: data.patch_type || normalizePatchType(data.product_id || data.patchType || context.product && context.product.title),
        quantity: parseInt(data.quantity, 10) || 1,
        page_path: data.page_path || window.location.pathname,
        size: compactSize(data.size),
        schedule: data.schedule || ''
      }
    }, false);

    if (window.FineystMeta && typeof window.FineystMeta.trackLead === 'function') {
      window.FineystMeta.trackLead(Object.assign({}, data, {
        eventId: eventId,
        content_name: data.content_name || data.product_name || context.product && context.product.title,
        content_category: data.content_category || data.patch_type || data.patchType || context.product && context.product.type,
        currency: data.currency || context.currency || 'USD',
        value: data.value || data.subTotal || data.total || 0
      }));
    }
  }

  function trackViewCart() {
    var cart = context.cart;
    if (!cart || !cart.items || !cart.items.length) return;

    push('view_cart', {
      currency: context.currency || cart.currency || 'USD',
      value: toNumber(cart.value),
      items: cart.items.map(function (item) {
        return {
          item_id: String(item.id || ''),
          item_name: item.name || '',
          item_category: item.category || 'Patches',
          item_variant: item.variant || '',
          price: toNumber(item.price),
          quantity: parseInt(item.quantity, 10) || 1
        };
      })
    }, true);
  }

  function trackPurchase() {
    var purchase = context.purchase;
    if (!purchase || !purchase.transaction_id) return;

    var storageKey = 'purchase-tracked-' + purchase.transaction_id;
    if (storage && storage.getItem(storageKey)) return;

    push('purchase', {
      transaction_id: String(purchase.transaction_id),
      value: toNumber(purchase.value),
      currency: purchase.currency || context.currency || 'USD',
      items: (purchase.items || []).map(function (item) {
        return {
          item_id: String(item.id || ''),
          item_name: item.name || '',
          item_category: item.category || 'Patches',
          item_variant: item.variant || '',
          price: toNumber(item.price),
          quantity: parseInt(item.quantity, 10) || 1
        };
      })
    }, true);

    if (storage) {
      storage.setItem(storageKey, 'true');
      storage.removeItem('last-checkout-time');
    }
  }

  function bindCheckoutClicks() {
    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[name="checkout"], .cart-checkout-btn')) {
        trackBeginCheckout();
      }
    });
  }

  window.FineystAnalytics = {
    push: push,
    trackPageView: trackPageView,
    trackViewItem: trackViewItem,
    trackAddToCart: trackAddToCart,
    trackViewCart: trackViewCart,
    trackBeginCheckout: trackBeginCheckout,
    trackQuoteRequestSubmitted: trackQuoteRequestSubmitted,
    trackPurchase: trackPurchase
  };

  trackPageView();
  trackViewItem();
  trackViewCart();
  trackPurchase();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindCheckoutClicks);
  } else {
    bindCheckoutClicks();
  }
})();
