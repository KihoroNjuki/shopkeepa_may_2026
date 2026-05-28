from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import generics

from .models import Business, Branch, BranchMember
from .analytics import (
    sales_summary,
    revenue_by_payment_method,
    top_products,
    sales_trend,
    branch_comparison,
    low_stock_summary,
)


def get_accessible_branch_ids(user, business):
    """Returns branch ids the user can access for this business."""
    if business.owner == user:
        return list(business.branches.values_list('id', flat=True))
    return list(
        BranchMember.objects.filter(
            user=user,
            branch__business=business
        ).values_list('branch__id', flat=True)
    )


class BusinessAnalyticsView(APIView):
    """GET /api/analytics/<business_id>/
       Full analytics summary for a business.
       Owners see all branches, managers/cashiers see their branches only.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, business_id):
        business = generics.get_object_or_404(Business, id=business_id)
        period      = request.query_params.get('period', 'month')
        granularity = request.query_params.get('granularity', 'day')

        branch_ids = get_accessible_branch_ids(request.user, business)

        if not branch_ids:
            return Response({'detail': 'You do not have access to this business.'}, status=403)

        return Response({
            'period':                 period,
            'summary':                sales_summary(branch_ids, period),
            'revenue_by_payment':     revenue_by_payment_method(branch_ids, period),
            'top_products':           top_products(branch_ids, period),
            'sales_trend':            sales_trend(branch_ids, period, granularity),
            'branch_comparison':      branch_comparison(branch_ids, period),
            'low_stock':              low_stock_summary(branch_ids),
        })


class BranchAnalyticsView(APIView):
    """GET /api/analytics/<business_id>/branches/<branch_id>/
       Analytics for a single branch.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, business_id, branch_id):
        branch      = generics.get_object_or_404(Branch, id=branch_id, business__id=business_id)
        period      = request.query_params.get('period', 'month')
        granularity = request.query_params.get('granularity', 'day')
        branch_ids  = [branch.id]

        return Response({
            'period':             period,
            'branch':             branch.name,
            'summary':            sales_summary(branch_ids, period),
            'revenue_by_payment': revenue_by_payment_method(branch_ids, period),
            'top_products':       top_products(branch_ids, period),
            'sales_trend':        sales_trend(branch_ids, period, granularity),
            'low_stock':          low_stock_summary(branch_ids),
        })