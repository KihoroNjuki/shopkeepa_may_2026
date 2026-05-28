from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Business, Branch, BranchMember, RolePrivilege, MemberPrivilegeOverride

User = get_user_model()



class BranchMemberSerializer(serializers.ModelSerializer):
    user_email    = serializers.EmailField(source='user.email', read_only=True)
    user_name     = serializers.CharField(source='user.full_name', read_only=True)
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)

    class Meta:
        model  = BranchMember
        fields = ('id', 'user', 'user_email', 'user_name', 'role', 'invited_by_email', 'joined_at')
        read_only_fields = ('id', 'invited_by_email', 'joined_at')


class InviteMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role  = serializers.ChoiceField(choices=BranchMember.Role.choices)

    def validate_email(self, value):
        try:
            return User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('No user found with this email address.')

    def validate(self, attrs):
        user   = attrs['email']  # already resolved to User in validate_email
        branch = self.context['branch']

        if BranchMember.objects.filter(branch=branch, user=user).exists():
            raise serializers.ValidationError('This user is already a member of this branch.')

        if branch.business.owner == user:
            raise serializers.ValidationError('The business owner cannot be added as a member.')

        attrs['user'] = user
        return attrs


class BranchSerializer(serializers.ModelSerializer):
    members      = BranchMemberSerializer(many=True, read_only=True)
    member_count = serializers.IntegerField(source='members.count', read_only=True)
    business_id  = serializers.UUIDField(source='business.id', read_only=True) 

    class Meta:
        model  = Branch
        fields = ('id', 'name', 'location', 'is_active', 'member_count','business_id', 'members', 'created_at')
        read_only_fields = ('id', 'created_at')


class BusinessSerializer(serializers.ModelSerializer):
    branches      = BranchSerializer(many=True, read_only=True)
    branch_count  = serializers.IntegerField(source='branches.count', read_only=True)
    owner_email   = serializers.EmailField(source='owner.email', read_only=True)

    class Meta:
        model  = Business
        fields = ('id', 'name', 'industry', 'owner_email', 'branch_count', 'branches', 'created_at')
        read_only_fields = ('id', 'owner_email', 'created_at')


class BusinessSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing businesses without nested data."""
    branch_count = serializers.IntegerField(source='branches.count', read_only=True)
    owner_email  = serializers.EmailField(source='owner.email', read_only=True)

    class Meta:
        model  = Business
        fields = ('id', 'name', 'industry', 'owner_email', 'branch_count', 'created_at')
        read_only_fields = ('id', 'owner_email', 'created_at')

class RolePrivilegeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = RolePrivilege
        exclude = ('id', 'business')

class MemberPrivilegeOverrideSerializer(serializers.ModelSerializer):
    class Meta:
        model   = MemberPrivilegeOverride
        exclude = ('id', 'member', 'business')