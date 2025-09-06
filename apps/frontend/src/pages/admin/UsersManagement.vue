<script setup lang="ts">
import Avatar from 'primevue/avatar'
import Badge from 'primevue/badge'
// PrimeVue 组件
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Card from 'primevue/card'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { client } from '@/share/useTreaty'

// 类型定义
interface User {
    id: number
    username: string
    email: string
    phone: string
    nickname: string
    avatar: string
    gender: 'male' | 'female' | 'unknown'
    birthday: Date | null
    status: UserStatus
    level: UserLevel
    points: number
    balance: number
    totalOrders: number
    totalSpent: number
    lastLoginAt: Date | null
    lastLoginIp: string
    registeredAt: Date
    isEmailVerified: boolean
    isPhoneVerified: boolean
    remark: string
    tags: string[]
}

interface UserForm {
    username: string
    email: string
    phone: string
    nickname: string
    password?: string
    gender: 'male' | 'female' | 'unknown'
    birthday: Date | null
    status: UserStatus
    level: UserLevel
    points: number
    balance: number
    remark: string
    tags: string[]
}

type UserStatus = 'active' | 'inactive' | 'banned' | 'pending'
type UserLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const users = ref<User[]>([])
const selectedUsers = ref<User[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const sortField = ref('registeredAt')
const sortOrder = ref(-1)
const searchKeyword = ref('')
const filterStatus = ref('all')
const filterLevel = ref('all')
const filterDateRange = ref<Date[]>([])
const showCreateDialog = ref(false)
const editingUser = ref<User | null>(null)

// 表单数据
const userForm = ref<UserForm>({
    username: '',
    email: '',
    phone: '',
    nickname: '',
    password: '',
    gender: 'unknown',
    birthday: null,
    status: 'active',
    level: 'bronze',
    points: 0,
    balance: 0,
    remark: '',
    tags: []
})

// 选项数据
const statusOptions = [
    { label: '全部状态', value: 'all' },
    { label: '正常', value: 'active' },
    { label: '禁用', value: 'inactive' },
    { label: '封禁', value: 'banned' },
    { label: '待审核', value: 'pending' }
]

const levelOptions = [
    { label: '全部等级', value: 'all' },
    { label: '青铜会员', value: 'bronze' },
    { label: '白银会员', value: 'silver' },
    { label: '黄金会员', value: 'gold' },
    { label: '铂金会员', value: 'platinum' },
    { label: '钻石会员', value: 'diamond' }
]

const userStatusOptions = [
    { label: '正常', value: 'active' },
    { label: '禁用', value: 'inactive' },
    { label: '封禁', value: 'banned' },
    { label: '待审核', value: 'pending' }
]

const userLevelOptions = [
    { label: '青铜会员', value: 'bronze' },
    { label: '白银会员', value: 'silver' },
    { label: '黄金会员', value: 'gold' },
    { label: '铂金会员', value: 'platinum' },
    { label: '钻石会员', value: 'diamond' }
]

const genderOptions = [
    { label: '未知', value: 'unknown' },
    { label: '男', value: 'male' },
    { label: '女', value: 'female' }
]

const availableTags = ref([
    'VIP客户', '活跃用户', '新用户', '老客户', '高价值客户', '潜在客户'
])

// 工具函数
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

// 计算属性
const isFormValid = computed(() => {
    return userForm.value.username.trim() &&
        userForm.value.email.trim() &&
        userForm.value.nickname.trim() &&
        (!editingUser.value ? userForm.value.password?.trim() : true)
})

const userStatistics = computed(() => {
    const stats = {
        total: users.value.length,
        active: 0,
        inactive: 0,
        banned: 0,
        pending: 0
    }
    
    users.value.forEach(user => {
        stats[user.status]++
    })
    
    return stats
})

const tagOptions = computed(() => {
    return availableTags.value.map(tag => ({
        label: tag,
        value: tag
    }))
})

// 方法
const loadUsers = async () => {
    try {
        loading.value = true
        const params = {
            page: page.value,
            pageSize: pageSize.value,
            sortBy: sortField.value,
            sortOrder: sortOrder.value === 1 ? 'asc' : 'desc',
            search: searchKeyword.value || undefined,
            status: filterStatus.value !== 'all' ? filterStatus.value : undefined,
            level: filterLevel.value !== 'all' ? filterLevel.value : undefined,
            startDate: filterDateRange.value?.[0],
            endDate: filterDateRange.value?.[1]
        }

        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 模拟数据
        const mockUsers: User[] = [
            {
                id: 1,
                username: 'zhangsan',
                email: 'zhangsan@example.com',
                phone: '13800138000',
                nickname: '张三',
                avatar: '/uploads/avatar1.jpg',
                gender: 'male',
                birthday: new Date('1990-01-01'),
                status: 'active',
                level: 'gold',
                points: 1500,
                balance: 299.50,
                totalOrders: 25,
                totalSpent: 12580.00,
                lastLoginAt: new Date(),
                lastLoginIp: '192.168.1.100',
                registeredAt: new Date(Date.now() - 86400000 * 30),
                isEmailVerified: true,
                isPhoneVerified: true,
                remark: 'VIP客户，购买力强',
                tags: ['VIP客户', '活跃用户']
            },
            {
                id: 2,
                username: 'lisi',
                email: 'lisi@example.com',
                phone: '13900139000',
                nickname: '李四',
                avatar: '/uploads/avatar2.jpg',
                gender: 'female',
                birthday: new Date('1995-05-15'),
                status: 'active',
                level: 'silver',
                points: 800,
                balance: 150.00,
                totalOrders: 12,
                totalSpent: 3200.00,
                lastLoginAt: new Date(Date.now() - 3600000),
                lastLoginIp: '192.168.1.101',
                registeredAt: new Date(Date.now() - 86400000 * 60),
                isEmailVerified: true,
                isPhoneVerified: false,
                remark: '',
                tags: ['活跃用户']
            },
            {
                id: 3,
                username: 'wangwu',
                email: 'wangwu@example.com',
                phone: '13700137000',
                nickname: '王五',
                avatar: '',
                gender: 'unknown',
                birthday: null,
                status: 'inactive',
                level: 'bronze',
                points: 100,
                balance: 0,
                totalOrders: 2,
                totalSpent: 199.00,
                lastLoginAt: new Date(Date.now() - 86400000 * 7),
                lastLoginIp: '192.168.1.102',
                registeredAt: new Date(Date.now() - 86400000 * 90),
                isEmailVerified: false,
                isPhoneVerified: true,
                remark: '长期未登录',
                tags: ['潜在客户']
            }
        ]
        
        users.value = mockUsers
        total.value = mockUsers.length
        
    } catch (error) {
        console.error('加载用户失败:', error)
        users.value = []
        total.value = 0
        toast.add({ severity: 'error', summary: '错误', detail: '加载用户失败', life: 1000 })
    } finally {
        loading.value = false
    }
}

// 分页处理
const onPage = (event: any) => {
    page.value = event.page + 1
    pageSize.value = event.rows
    loadUsers()
}

// 排序处理
const onSort = (event: any) => {
    sortField.value = event.sortField
    sortOrder.value = event.sortOrder
    loadUsers()
}

// 搜索处理
const handleSearch = () => {
    page.value = 1
    loadUsers()
}

// 筛选处理
const handleFilter = () => {
    page.value = 1
    loadUsers()
}

// 显示编辑对话框
const showEditDialog = (user: User) => {
    editingUser.value = user
    userForm.value = {
        username: user.username,
        email: user.email,
        phone: user.phone,
        nickname: user.nickname,
        password: '',
        gender: user.gender,
        birthday: user.birthday,
        status: user.status,
        level: user.level,
        points: user.points,
        balance: user.balance,
        remark: user.remark,
        tags: [...user.tags]
    }
    showCreateDialog.value = true
}

// 关闭对话框
const closeDialog = () => {
    showCreateDialog.value = false
    editingUser.value = null
    userForm.value = {
        username: '',
        email: '',
        phone: '',
        nickname: '',
        password: '',
        gender: 'unknown',
        birthday: null,
        status: 'active',
        level: 'bronze',
        points: 0,
        balance: 0,
        remark: '',
        tags: []
    }
}

// 保存用户
const saveUser = async () => {
    if (!isFormValid.value) {
        toast.add({ severity: 'warn', summary: '警告', detail: '请填写必填字段', life: 1000 })
        return
    }

    try {
        saving.value = true

        if (editingUser.value) {
            // 更新
            toast.add({ severity: 'success', summary: '成功', detail: '更新用户成功', life: 1000 })
        } else {
            // 创建
            toast.add({ severity: 'success', summary: '成功', detail: '创建用户成功', life: 1000 })
        }
        
        closeDialog()
        loadUsers()
    } catch (error) {
        console.error('保存用户失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: '保存用户失败', life: 1000 })
    } finally {
        saving.value = false
    }
}

// 确认删除
const confirmDelete = (user: User) => {
    confirm.require({
        message: `确定要删除用户 "${user.nickname}" 吗？`,
        header: '删除确认',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => deleteUser(user.id)
    })
}

// 删除用户
const deleteUser = async (id: number) => {
    try {
        toast.add({ severity: 'success', summary: '成功', detail: '删除用户成功', life: 1000 })
        loadUsers()
    } catch (error) {
        console.error('删除用户失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: '删除用户失败', life: 1000 })
    }
}

// 切换用户状态
const toggleUserStatus = async (user: User) => {
    try {
        const newStatus = user.status === 'active' ? 'inactive' : 'active'
        user.status = newStatus
        toast.add({
            severity: 'success',
            summary: '成功',
            detail: `${newStatus === 'active' ? '启用' : '禁用'}用户成功`,
            life: 1000
        })
        loadUsers()
    } catch (error) {
        console.error('切换用户状态失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: '切换用户状态失败', life: 1000 })
    }
}

// 重置密码
const resetPassword = async (user: User) => {
    confirm.require({
        message: `确定要重置用户 "${user.nickname}" 的密码吗？`,
        header: '重置密码确认',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                // 模拟API调用
                await new Promise(resolve => setTimeout(resolve, 500))
                toast.add({ severity: 'success', summary: '成功', detail: '密码重置成功，新密码已发送到用户邮箱', life: 1000 })
            } catch (error) {
                console.error('重置密码失败:', error)
                toast.add({ severity: 'error', summary: '错误', detail: '重置密码失败', life: 1000 })
            }
        }
    })
}

// 获取状态标签样式
const getStatusSeverity = (status: UserStatus) => {
    const severityMap = {
        active: 'success',
        inactive: 'warning',
        banned: 'danger',
        pending: 'info'
    }
    return severityMap[status] || 'secondary'
}

const getLevelSeverity = (level: UserLevel) => {
    const severityMap = {
        bronze: 'secondary',
        silver: 'info',
        gold: 'warning',
        platinum: 'primary',
        diamond: 'success'
    }
    return severityMap[level] || 'secondary'
}

// 获取状态文本
const getStatusText = (status: UserStatus) => {
    const textMap = {
        active: '正常',
        inactive: '禁用',
        banned: '封禁',
        pending: '待审核'
    }
    return textMap[status] || status
}

const getLevelText = (level: UserLevel) => {
    const textMap = {
        bronze: '青铜',
        silver: '白银',
        gold: '黄金',
        platinum: '铂金',
        diamond: '钻石'
    }
    return textMap[level] || level
}

const getGenderText = (gender: 'male' | 'female' | 'unknown') => {
    const textMap = {
        male: '男',
        female: '女',
        unknown: '未知'
    }
    return textMap[gender] || gender
}

// 格式化金额
const formatCurrency = (amount: number) => {
    return '¥' + amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

// 格式化日期
const formatDate = (date: Date | string | null) => {
    if (!date) return '-'
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// 导出用户
const exportUsers = () => {
    toast.add({ severity: 'info', summary: '提示', detail: '导出功能开发中...', life: 1000 })
}

// 组件挂载时加载数据
onMounted(() => {
    loadUsers()
})
</script>

<template>
    <div class="users-management">
        <!-- 页面标题和统计 -->
        <div class="header-section">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">用户管理</h1>
                    <p class="text-gray-600 mt-1">管理所有用户信息，包括用户状态、等级、积分等</p>
                </div>
                <div class="flex gap-3">
                    <Button label="新增用户" icon="pi pi-plus" @click="showCreateDialog = true" class="p-button-success" />
                    <Button label="导出用户" icon="pi pi-download" @click="exportUsers" class="p-button-outlined" />
                </div>
            </div>

            <!-- 统计卡片 -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-blue-600">{{ userStatistics.total }}</div>
                        <div class="text-sm text-gray-600">总用户</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-green-600">{{ userStatistics.active }}</div>
                        <div class="text-sm text-gray-600">正常用户</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-orange-600">{{ userStatistics.inactive }}</div>
                        <div class="text-sm text-gray-600">禁用用户</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-red-600">{{ userStatistics.banned }}</div>
                        <div class="text-sm text-gray-600">封禁用户</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-purple-600">{{ userStatistics.pending }}</div>
                        <div class="text-sm text-gray-600">待审核</div>
                    </template>
                </Card>
            </div>

            <!-- 工具栏 -->
            <div class="flex justify-between items-center mb-4">
                <div class="flex gap-3">
                    <Button label="刷新" icon="pi pi-refresh" @click="loadUsers" class="p-button-outlined" size="small" />
                    <Button label="批量启用" icon="pi pi-check" class="p-button-outlined" size="small" :disabled="!selectedUsers.length" />
                    <Button label="批量禁用" icon="pi pi-times" class="p-button-outlined" size="small" :disabled="!selectedUsers.length" />
                </div>
                <div class="flex gap-3">
                    <InputText v-model="searchKeyword" placeholder="搜索用户名、昵称或邮箱..." class="w-64" @input="handleSearch" />
                    <Select v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value"
                        placeholder="筛选状态" class="w-32" @change="handleFilter" />
                    <Select v-model="filterLevel" :options="levelOptions" optionLabel="label" optionValue="value"
                        placeholder="筛选等级" class="w-32" @change="handleFilter" />
                    <Calendar v-model="filterDateRange" selectionMode="range" placeholder="注册日期范围" 
                        class="w-48" @date-select="handleFilter" showIcon />
                </div>
            </div>
        </div>

        <!-- 用户数据表格 -->
        <div class="table-section">
            <DataTable :value="users" tableStyle="min-width: 50rem" :loading="loading"
                v-model:selection="selectedUsers" dataKey="id" paginator :rows="pageSize"
                :rowsPerPageOptions="[5, 10, 20, 50]" :totalRecords="total" :lazy="true" @page="onPage" @sort="onSort"
                :sortField="sortField" :sortOrder="sortOrder" :first="(page - 1) * pageSize" class="p-datatable-sm"
                showGridlines responsiveLayout="scroll" selectionMode="multiple" :metaKeySelection="false">

                <template #header>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <span class="text-xl font-bold">用户列表</span>
                        <Button icon="pi pi-refresh" rounded raised />
                    </div>
                </template>

                <!-- 选择列 -->
                <Column selectionMode="multiple" class="w-[3%]"></Column>

                <!-- 头像列 -->
                <Column field="avatar" header="头像" class="w-[8%]">
                    <template #body="{ data }">
                        <div class="flex justify-center">
                            <Avatar v-if="data.avatar" :image="data.avatar" size="large" shape="circle" />
                            <Avatar v-else :label="data.nickname.charAt(0)" size="large" shape="circle" 
                                class="bg-blue-500 text-white" />
                        </div>
                    </template>
                </Column>

                <!-- 用户信息列 -->
                <Column field="username" header="用户信息" sortable class="w-[18%]">
                    <template #body="{ data }">
                        <div>
                            <p class="font-medium text-sm mb-1">{{ data.nickname }}</p>
                            <p class="text-xs text-gray-600 mb-1">@{{ data.username }}</p>
                            <p class="text-xs text-gray-600">{{ data.email }}</p>
                            <div class="flex flex-wrap gap-1 mt-1">
                                <Tag v-for="tag in data.tags" :key="tag" :value="tag" severity="info" class="text-xs" />
                            </div>
                        </div>
                    </template>
                </Column>

                <!-- 联系方式列 -->
                <Column field="phone" header="联系方式" class="w-[12%]">
                    <template #body="{ data }">
                        <div>
                            <p class="text-sm">{{ data.phone }}</p>
                            <div class="flex gap-1 mt-1">
                                <Badge v-if="data.isEmailVerified" value="邮箱已验证" severity="success" class="text-xs" />
                                <Badge v-if="data.isPhoneVerified" value="手机已验证" severity="success" class="text-xs" />
                            </div>
                        </div>
                    </template>
                </Column>

                <!-- 等级积分列 -->
                <Column field="level" header="等级积分" class="w-[12%]">
                    <template #body="{ data }">
                        <div>
                            <Tag :value="getLevelText(data.level)" :severity="getLevelSeverity(data.level)" class="text-xs mb-1" />
                            <p class="text-xs text-gray-600">积分: {{ data.points }}</p>
                            <p class="text-xs text-gray-600">余额: {{ formatCurrency(data.balance) }}</p>
                        </div>
                    </template>
                </Column>

                <!-- 消费统计列 -->
                <Column field="totalSpent" header="消费统计" sortable class="w-[12%]">
                    <template #body="{ data }">
                        <div>
                            <p class="text-sm font-medium text-red-600">{{ formatCurrency(data.totalSpent) }}</p>
                            <p class="text-xs text-gray-600">订单: {{ data.totalOrders }}笔</p>
                        </div>
                    </template>
                </Column>

                <!-- 状态列 -->
                <Column field="status" header="状态" class="w-[10%]">
                    <template #body="{ data }">
                        <div class="flex items-center gap-2">
                            <ToggleSwitch v-model="data.status" 
                                :true-value="'active'" :false-value="'inactive'"
                                @change="toggleUserStatus(data)" class="scale-75" />
                            <Tag :value="getStatusText(data.status)" :severity="getStatusSeverity(data.status)" class="text-xs" />
                        </div>
                    </template>
                </Column>

                <!-- 最后登录列 -->
                <Column field="lastLoginAt" header="最后登录" sortable class="w-[12%]">
                    <template #body="{ data }">
                        <div>
                            <p class="text-xs text-gray-600">{{ formatDate(data.lastLoginAt) }}</p>
                            <p class="text-xs text-gray-500">{{ data.lastLoginIp }}</p>
                        </div>
                    </template>
                </Column>

                <!-- 注册时间列 -->
                <Column field="registeredAt" header="注册时间" sortable class="w-[10%]">
                    <template #body="{ data }">
                        <span class="text-gray-500 text-sm">{{ formatDate(data.registeredAt) }}</span>
                    </template>
                </Column>

                <!-- 操作列 -->
                <Column header="操作" class="w-[15%]">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button icon="pi pi-eye" @click="router.push(`/admin/users/${data.id}`)"
                                class="p-button-info p-button-sm" v-tooltip.top="'查看详情'" />
                            <Button icon="pi pi-pencil" @click="showEditDialog(data)"
                                class="p-button-warning p-button-sm" v-tooltip.top="'编辑'" />
                            <Button icon="pi pi-key" @click="resetPassword(data)"
                                class="p-button-secondary p-button-sm" v-tooltip.top="'重置密码'" />
                            <Button icon="pi pi-trash" @click="confirmDelete(data)" 
                                class="p-button-danger p-button-sm" v-tooltip.top="'删除'" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- 创建/编辑用户对话框 -->
        <Dialog v-model:visible="showCreateDialog" :header="editingUser ? '编辑用户' : '新增用户'" :modal="true"
            :closable="true" class="w-[800px]">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">用户名 *</label>
                        <InputText v-model="userForm.username" placeholder="请输入用户名" class="w-full"
                            :class="{ 'p-invalid': !userForm.username }" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">昵称 *</label>
                        <InputText v-model="userForm.nickname" placeholder="请输入昵称" class="w-full"
                            :class="{ 'p-invalid': !userForm.nickname }" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">邮箱 *</label>
                        <InputText v-model="userForm.email" placeholder="请输入邮箱" class="w-full"
                            :class="{ 'p-invalid': !userForm.email }" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">手机号</label>
                        <InputText v-model="userForm.phone" placeholder="请输入手机号" class="w-full" />
                    </div>

                    <div v-if="!editingUser">
                        <label class="block text-sm font-medium mb-2">密码 *</label>
                        <Password v-model="userForm.password" placeholder="请输入密码" class="w-full"
                            :class="{ 'p-invalid': !userForm.password }" toggleMask />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">性别</label>
                        <Select v-model="userForm.gender" :options="genderOptions" optionLabel="label" 
                            optionValue="value" placeholder="选择性别" class="w-full" />
                    </div>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">生日</label>
                        <Calendar v-model="userForm.birthday" placeholder="选择生日" class="w-full" showIcon />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">用户状态</label>
                        <Select v-model="userForm.status" :options="userStatusOptions" optionLabel="label" 
                            optionValue="value" placeholder="选择状态" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">用户等级</label>
                        <Select v-model="userForm.level" :options="userLevelOptions" optionLabel="label" 
                            optionValue="value" placeholder="选择等级" class="w-full" />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium mb-2">积分</label>
                            <InputNumber v-model="userForm.points" :min="0" placeholder="0" class="w-full" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">余额</label>
                            <InputNumber v-model="userForm.balance" :min="0" :maxFractionDigits="2" 
                                placeholder="0.00" class="w-full" />
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">用户标签</label>
                        <Select v-model="userForm.tags" :options="tagOptions" optionLabel="label" 
                            optionValue="value" placeholder="选择标签" class="w-full" multiple />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">备注</label>
                        <Textarea v-model="userForm.remark" placeholder="请输入备注" rows="3" class="w-full" />
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <Button label="取消" @click="closeDialog" class="p-button-text" />
                    <Button :label="editingUser ? '更新' : '创建'" @click="saveUser" 
                        :loading="saving" :disabled="!isFormValid" />
                </div>
            </template>
        </Dialog>

        <!-- 确认对话框 -->
        <ConfirmDialog />
    </div>
</template>

<style scoped>
.users-management {
    @apply p-0;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .header-section {
        @apply mb-4;
    }
    
    .table-section {
        @apply overflow-x-auto;
    }
}
</style>