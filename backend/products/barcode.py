import requests

OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
OPEN_UPC_URL        = "https://api.upcitemdb.com/prod/trial/lookup?upc={barcode}"


def lookup_barcode(barcode: str) -> dict | None:
    """
    Try to find product info from a barcode.
    Returns a dict with product details or None if not found.
    Tries Open Food Facts first, then UPC Item DB as fallback.
    """

    # ── Try Open Food Facts ───────────────────────────────────────────────────
    try:
        response = requests.get(
            OPEN_FOOD_FACTS_URL.format(barcode=barcode),
            timeout=5
        )
        data = response.json()

        if data.get('status') == 1:
            product = data.get('product', {})
            name    = (
                product.get('product_name_en') or
                product.get('product_name') or
                ''
            ).strip()

            if name:
                return {
                    'name':     name,
                    'barcode':  barcode,
                    'category': product.get('categories_tags', [''])[0].replace('en:', '').replace('-', ' ').title() if product.get('categories_tags') else '',
                    'unit':     'piece',
                    'source':   'openfoodfacts',
                }
    except Exception:
        pass

    # ── Fallback: UPC Item DB ─────────────────────────────────────────────────
    try:
        response = requests.get(
            OPEN_UPC_URL.format(barcode=barcode),
            timeout=5
        )
        data = response.json()
        items = data.get('items', [])

        if items:
            item = items[0]
            return {
                'name':     item.get('title', '').strip(),
                'barcode':  barcode,
                'category': item.get('category', '').title(),
                'unit':     'piece',
                'source':   'upcitemdb',
            }
    except Exception:
        pass

    return None