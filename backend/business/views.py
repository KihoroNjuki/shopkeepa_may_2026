from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Business, Branch, BranchMember, RolePrivilege
from .serializers import (
    BusinessSerializer,
    BusinessSummarySerializer,
    BranchSerializer,
    BranchMemberSerializer,
    InviteMemberSerializer,
    RolePrivilegeSerializer,
    MemberPrivilegeOverrideSerializer
)

from .permissions import IsBusinessOwner, IsOwnerOrManager, IsBranchMember
from .models import Business, Branch, BranchMember, RolePrivilege, MemberPrivilegeOverride


# ── Business Views ─────────────────────────────────────────────────────────────

class BusinessListCreateView(generics.ListCreateAPIView):
    """GET /api/business/  — list own businesses
       POST /api/business/ — create a new business"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return BusinessSummarySerializer
        return BusinessSerializer

    def get_queryset(self):
        return Business.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class BusinessDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/business/<id>/"""
    permission_classes = [IsAuthenticated, IsBusinessOwner]
    serializer_class   = BusinessSerializer

    def get_queryset(self):
        return Business.objects.filter(owner=self.request.user)


# ── Branch Views ───────────────────────────────────────────────────────────────

class BranchListCreateView(generics.ListCreateAPIView):
    """GET /api/business/<business_id>/branches/  — list branches
       POST /api/business/<business_id>/branches/ — create a branch"""
    permission_classes = [IsAuthenticated, IsBusinessOwner]
    serializer_class   = BranchSerializer

    def get_business(self):
        return generics.get_object_or_404(
            Business, id=self.kwargs['business_id'], owner=self.request.user
        )

    def get_queryset(self):
        return Branch.objects.filter(business=self.get_business())

    def perform_create(self, serializer):
        serializer.save(business=self.get_business())


class BranchDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/business/<business_id>/branches/<id>/"""
    permission_classes = [IsAuthenticated, IsOwnerOrManager]
    serializer_class   = BranchSerializer

    def get_queryset(self):
        return Branch.objects.filter(business__id=self.kwargs['business_id'])


# ── Branch Member Views ────────────────────────────────────────────────────────

class InviteMemberView(APIView):
    """POST /api/business/<business_id>/branches/<branch_id>/invite/"""
    permission_classes = [IsAuthenticated, IsOwnerOrManager]

    def post(self, request, business_id, branch_id):
        branch = generics.get_object_or_404(
            Branch, id=branch_id, business__id=business_id
        )
        self.check_object_permissions(request, branch)

        serializer = InviteMemberSerializer(
            data=request.data,
            context={'branch': branch}
        )
        serializer.is_valid(raise_exception=True)

        member = BranchMember.objects.create(
            branch=branch,
            user=serializer.validated_data['user'],
            role=serializer.validated_data['role'],
            invited_by=request.user,
        )
        return Response(
            BranchMemberSerializer(member).data,
            status=status.HTTP_201_CREATED
        )


class RemoveMemberView(APIView):
    """DELETE /api/business/<business_id>/branches/<branch_id>/members/<member_id>/"""
    permission_classes = [IsAuthenticated, IsOwnerOrManager]

    def delete(self, request, business_id, branch_id, member_id):
        branch = generics.get_object_or_404(
            Branch, id=branch_id, business__id=business_id
        )
        self.check_object_permissions(request, branch)

        member = generics.get_object_or_404(BranchMember, id=member_id, branch=branch)
        member.delete()
        return Response({'detail': 'Member removed successfully.'}, status=status.HTTP_200_OK)


class MyBranchesView(generics.ListAPIView):
    """GET /api/business/my-branches/
       Returns branches where the user is a member but NOT the business owner.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = BranchSerializer

    def get_queryset(self):
        memberships = BranchMember.objects.filter(
            user=self.request.user
        ).values_list('branch_id', flat=True)

        return Branch.objects.filter(
            id__in=memberships
        ).exclude(
            business__owner=self.request.user  # ← exclude owned businesses
        )
    
class RolePrivilegeView(APIView):
    """GET/PATCH /api/business/<business_id>/privileges/"""
    permission_classes = [IsAuthenticated, IsBusinessOwner]

    def get_business(self, request, business_id):
        return generics.get_object_or_404(Business, id=business_id, owner=request.user)

    def get(self, request, business_id):
        business   = self.get_business(request, business_id)
        privileges, _ = RolePrivilege.objects.get_or_create(business=business)
        return Response(RolePrivilegeSerializer(privileges).data)

    def patch(self, request, business_id):
        business   = self.get_business(request, business_id)
        privileges, _ = RolePrivilege.objects.get_or_create(business=business)
        serializer = RolePrivilegeSerializer(privileges, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
class MyPrivilegesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, business_id):
        business = generics.get_object_or_404(Business, id=business_id)

        if business.owner == request.user:
            return Response({'role': 'owner', 'is_owner': True})

        membership = BranchMember.objects.filter(
            user=request.user,
            branch__business=business
        ).select_related('privilege_override').first()

        if not membership:
            return Response({'detail': 'Not a member of this business.'}, status=403)

        privileges, _ = RolePrivilege.objects.get_or_create(business=business)
        role_privs     = privileges.get_privileges(membership.role)

        # apply member overrides on top of role defaults
        try:
            override = membership.privilege_override
            for key in role_privs:
                val = getattr(override, key, None)
                if val is not None:
                    role_privs[key] = val
        except MemberPrivilegeOverride.DoesNotExist:
            pass

        return Response({
            'role':     membership.role,
            'is_owner': False,
            **role_privs
        })
    
class MemberPrivilegeOverrideView(APIView):
    """GET/PATCH /api/business/<business_id>/branches/<branch_id>/members/<member_id>/privileges/"""
    permission_classes = [IsAuthenticated, IsBusinessOwner]

    def get_objects(self, request, business_id, branch_id, member_id):
        business = generics.get_object_or_404(Business, id=business_id, owner=request.user)
        member   = generics.get_object_or_404(BranchMember, id=member_id, branch__id=branch_id)
        return business, member

    def get(self, request, business_id, branch_id, member_id):
        business, member = self.get_objects(request, business_id, branch_id, member_id)
        override, _      = MemberPrivilegeOverride.objects.get_or_create(
            member=member, business=business
        )
        return Response(MemberPrivilegeOverrideSerializer(override).data)

    def patch(self, request, business_id, branch_id, member_id):
        business, member = self.get_objects(request, business_id, branch_id, member_id)
        override, _      = MemberPrivilegeOverride.objects.get_or_create(
            member=member, business=business
        )
        serializer = MemberPrivilegeOverrideSerializer(override, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)