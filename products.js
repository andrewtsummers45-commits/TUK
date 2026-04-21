// Netlify serverless function — proxies Printful API so the key stays secret.
// The PRINTFUL_API_KEY environment variable is set in Netlify dashboard only —
// it never appears in your source code or browser.

exports.handler = async () => {
  const API_KEY = process.env.PRINTFUL_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'PRINTFUL_API_KEY not set in environment variables' }),
    };
  }

  try {
    const res = await fetch('https://api.printful.com/store/products', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: `Printful error: ${text}` }),
      };
    }

    const data = await res.json();
    const products = (data.result || []).map(p => ({
      id: p.id,
      name: p.name,
      thumbnail_url: p.thumbnail_url || null,
      min_price: p.min_price || null,
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 10 minutes so the function isn't hammered on every page load
        'Cache-Control': 'public, s-maxage=600',
      },
      body: JSON.stringify(products),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
