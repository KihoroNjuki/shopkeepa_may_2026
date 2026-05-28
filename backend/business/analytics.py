from django.db.models import Sum, Count, Avg, F, Q
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from django.utils import timezone
from datetime import timedelta
from sales.models import Sale, SaleItem
from products.models import BranchStock


def get_date_range(period):
    """Returns start and end dates for a given period."""
    now = timezone.now()
    if period == 'today':
        return now.replace(hour=0, minute=0, second=0), now
    elif period == 'week':
        return now - timedelta(days=7), now
    elif period == 'month':
        return now - timedelta(days=30), now
    elif period == 'year':
        return now - timedelta(days=365), now
    return None, None


def sales_summary(branch_ids, period='month'):
    """Total revenue, sale count, average sale value."""
    start, end = get_date_range(period)
    qs = Sale.objects.filter(branch__id__in=branch_ids)
    if start:
        qs = qs.filter(created_at__range=(start, end))

    result = qs.aggregate(
        total_revenue = Sum('total'),
        total_sales   = Count('id'),
        average_sale  = Avg('total'),
    )
    return {
        'total_revenue': result['total_revenue'] or 0,
        'total_sales':   result['total_sales']   or 0,
        'average_sale':  result['average_sale']  or 0,
    }


def revenue_by_payment_method(branch_ids, period='month'):
    """Revenue broken down by payment method."""
    start, end = get_date_range(period)
    qs = Sale.objects.filter(branch__id__in=branch_ids)
    if start:
        qs = qs.filter(created_at__range=(start, end))

    return list(
        qs.values('payment_method')
          .annotate(total=Sum('total'), count=Count('id'))
          .order_by('-total')
    )


def top_products(branch_ids, period='month', limit=10):
    """Best selling products by quantity and revenue."""
    start, end = get_date_range(period)
    qs = SaleItem.objects.filter(sale__branch__id__in=branch_ids)
    if start:
        qs = qs.filter(sale__created_at__range=(start, end))

    return list(
        qs.values('product__id', 'product__name')
          .annotate(
              total_quantity = Sum('quantity'),
              total_revenue  = Sum(F('quantity') * F('unit_price')),
          )
          .order_by('-total_revenue')[:limit]
    )


def sales_trend(branch_ids, period='month', granularity='day'):
    """Sales over time — daily, weekly or monthly."""
    start, end = get_date_range(period)
    qs = Sale.objects.filter(branch__id__in=branch_ids)
    if start:
        qs = qs.filter(created_at__range=(start, end))

    trunc = {'day': TruncDay, 'week': TruncWeek, 'month': TruncMonth}.get(granularity, TruncDay)

    return list(
        qs.annotate(period=trunc('created_at'))
          .values('period')
          .annotate(revenue=Sum('total'), count=Count('id'))
          .order_by('period')
    )


def branch_comparison(branch_ids, period='month'):
    """Revenue and sales count per branch — for owner cross-branch view."""
    start, end = get_date_range(period)
    qs = Sale.objects.filter(branch__id__in=branch_ids)
    if start:
        qs = qs.filter(created_at__range=(start, end))

    return list(
        qs.values('branch__id', 'branch__name')
          .annotate(
              total_revenue = Sum('total'),
              total_sales   = Count('id'),
              average_sale  = Avg('total'),
          )
          .order_by('-total_revenue')
    )


def low_stock_summary(branch_ids):
    """All products below alert threshold across given branches."""
    from django.db.models import F
    return list(
        BranchStock.objects.filter(
            branch__id__in=branch_ids,
            quantity__lte=F('alert_threshold')
        ).values(
            'product__id',
            'product__name',
            'branch__name',
            'quantity',
            'alert_threshold',
        ).order_by('quantity')
    )