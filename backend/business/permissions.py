from rest_framework.permissions import BasePermission
from .models import Branch, BranchMember


class IsBusinessOwner(BasePermission):
    """User must be the owner of the business."""

    def has_object_permission(self, request, view, obj):
        # obj can be a Business or a Branch
        business = getattr(obj, 'business', obj)
        return business.owner == request.user


class IsBranchManager(BasePermission):
    """User must be a manager of the branch."""

    def has_object_permission(self, request, view, obj):
        branch = getattr(obj, 'branch', obj)
        return BranchMember.objects.filter(
            branch=branch,
            user=request.user,
            role=BranchMember.Role.MANAGER
        ).exists()


class IsOwnerOrManager(BasePermission):
    """User must be the business owner or a branch manager."""

    def has_object_permission(self, request, view, obj):
        branch   = getattr(obj, 'branch', obj)
        business = getattr(branch, 'business', None)

        if business and business.owner == request.user:
            return True

        return BranchMember.objects.filter(
            branch=branch,
            user=request.user,
            role__in=[BranchMember.Role.MANAGER]
        ).exists()


class IsBranchMember(BasePermission):
    """User must be any member of the branch (manager or cashier)."""

    def has_object_permission(self, request, view, obj):
        branch   = getattr(obj, 'branch', obj)
        business = getattr(branch, 'business', None)

        if business and business.owner == request.user:
            return True

        return BranchMember.objects.filter(
            branch=branch,
            user=request.user
        ).exists()