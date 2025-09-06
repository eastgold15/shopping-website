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
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import Password from 'primevue/password'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'


// 类型定义
interface Admin {
    id: number
    username: string
    email: string
    phone: string
    realName: string
    avatar: string
    role: AdminRole
    permissions: string[]
    status: AdminStatus
    lastLoginAt: Date | null
    lastLoginIp: string
    loginCount: number
    createdAt: Date
    createdBy: string
    remark: string
    department: string
    position: string
}

interface AdminForm {
    username: string
    email: string
    phone: string
    realName: string
    password?: string
    role: AdminRole
    permissions: string[]
    status: AdminStatus
    remark: string
    department: string
    position: string
}

type AdminStatus = 'active' | 'inactive' | 'locked'
type AdminRole = 'super_admin' | 'admin' | 'operator' | 'viewer'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const admins = ref<Admin[]>([])
const selectedAdmins = ref<Admin[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const sortField = ref('createdAt')
const sortOrder = ref(-1)
const searchKeyword = ref('')
const filterStatus = ref('all')
const filterRole = ref('all')
const filterDateRange = ref<Date[]>([])
const showCreateDialog = ref(false)
const editingAdmin = ref<Admin | null>(null)

// 表单数据
const adminForm = ref<AdminForm>({
    username: '',
    email: '',
    phone: '',
    realName: '',
    password: '',
    role: 'operator',
    permissions: [],
    status: 'active',
    remark: '',
    department: '',
    position: ''
})

// 选项数据
const statusOptions = [
    { label: '全部状态', value: 'all' },
    { label: '正常', value: 'active' },
    { label: '禁用', value: 'inactive' },
    { label: '锁定', value: 'locked' }
]

const roleOptions = [
    { label: '全部角色', value: 'all' },
    { label: '超级管理员', value: 'super_admin' },
    { label: '管理员', value: 'admin' },
    { label: '操作员', value: 'operator' },
    { label: '查看者', value: 'viewer' }
]

const adminStatusOptions = [
    { label: '正常', value: 'active' },
    { label: '禁用', value: 'inactive' },
    { label: '锁定', value: 'locked' }
]

const adminRoleOptions = [
    { label: '超级管理员', value: 'super_admin' },
    { label: '管理员', value: 'admin' },
    { label: '操作员', value: 'operator' },
    { label: '查看者', value: 'viewer' }
]

const permissionOptions = [
    { label: '用户管理', value: 'users.manage' },
    { label: '商品管理', value: 'products.manage' },
    { label: '订单管理', value: 'orders.manage' },
    { label: '内容管理', value: 'content.manage' },
    { label: '系统设置', value: 'system.manage' },
    { label: '数据统计', value: 'analytics.view' },
    { label: '财务管理', value: 'finance.manage' },
    { label: '营销管理', value: 'marketing.manage' }
]

const departmentOptions = [
    { label: '技术部', value: '技术部' },
    { label: '运营部', value: '运营部' },
    { label: '市场部', value: '市场部' },
    { label: '客服部', value: '客服部' },
    { label: '财务部', value: '财务部' },
    { label: '人事部', value: '人事部' }
]

// 工具函数
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

// 计算属性
const isFormValid = computed(() => {
    return adminForm.value.username.trim() &&
        adminForm.value.email.trim() &&
        adminForm.value.realName.trim() &&
        (!editingAdmin.value ? adminForm.value.password?.trim() : true)
})

const adminStatistics = computed(() => {
    const stats = {
        total: admins.value.length,
        active: 0,
        inactive: 0,
        locked: 0,
        super_admin: 0,
        admin: 0,
        operator: 0,
        viewer: 0
    }

    admins.value.forEach(admin => {
        stats[admin.status]++
        stats[admin.role]++
    })

    return stats
})

// 方法
const loadAdmins = async () => {
    try {
        loading.value = true
        const params = {
            page: page.value,
            pageSize: pageSize.value,
            sortBy: sortField.value,
            sortOrder: sortOrder.value === 1 ? 'asc' : 'desc',
            search: searchKeyword.value || undefined,
            status: filterStatus.value !== 'all' ? filterStatus.value : undefined,
            role: filterRole.value !== 'all' ? filterRole.value : undefined,
            startDate: filterDateRange.value?.[0],
            endDate: filterDateRange.value?.[1]
        }

        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500))

        // 模拟数据
        const mockAdmins: Admin[] = [
            {
                id: 1,
                username: 'superadmin',
                email: 'admin@example.com',
                phone: '13800138000',
                realName: '系统管理员',
                avatar: '/uploads/admin1.jpg',
                role: 'super_admin',
                permissions: ['users.manage', 'products.manage', 'orders.manage', 'content.manage', 'system.manage', 'analytics.view', 'finance.manage', 'marketing.manage'],
                status: 'active',
                lastLoginAt: new Date(),
                lastLoginIp: '192.168.1.100',
                loginCount: 1250,
                createdAt: new Date(Date.now() - 86400000 * 365),
                createdBy: 'system',
                remark: '系统超级管理员',
                department: '技术部',
                position: '技术总监'
            },
            {
                id: 2,
                username: 'admin001',
                email: 'admin001@example.com',
                phone: '13900139000',
                realName: '张三',
                avatar: '/uploads/admin2.jpg',
                role: 'admin',
                permissions: ['users.manage', 'products.manage', 'orders.manage', 'analytics.view'],
                status: 'active',
                lastLoginAt: new Date(Date.now() - 3600000),
                lastLoginIp: '192.168.1.101',
                loginCount: 580,
                createdAt: new Date(Date.now() - 86400000 * 180),
                createdBy: 'superadmin',
                remark: '运营管理员',
                department: '运营部',
                position: '运营经理'
            },
            {
                id: 3,
                username: 'operator001',
                email: 'operator001@example.com',
                phone: '13700137000',
                realName: '李四',
                avatar: '',
                role: 'operator',
                permissions: ['orders.manage', 'content.manage'],
                status: 'active',
                lastLoginAt: new Date(Date.now() - 86400000),
                lastLoginIp: '192.168.1.102',
                loginCount: 120,
                createdAt: new Date(Date.now() - 86400000 * 60),
                createdBy: 'admin001',
                remark: '客服操作员',
                department: '客服部',
                position: '客服专员'
            },
            {
                id: 4,
                username: 'viewer001',
                email: 'viewer001@example.com',
                phone: '13600136000',
                realName: '王五',
                avatar: '',
                role: 'viewer',
                permissions: ['analytics.view'],
                status: 'inactive',
                lastLoginAt: new Date(Date.now() - 86400000 * 7),
                lastLoginIp: '192.168.1.103',
                loginCount: 45,
                createdAt: new Date(Date.now() - 86400000 * 30),
                createdBy: 'admin001',
                remark: '数据分析师',
                department: '市场部',
                position: '数据分析师'
            }
        ]

        admins.value = mockAdmins
        total.value = mockAdmins.length

    } catch (error) {
        console.error('加载管理员失败:', error)
        admins.value = []
        total.value = 0
        toast.add({ severity: 'error', summary: '错误', detail: '加载管理员失败', life: 1000 })
    } finally {
        loading.value = false
    }
}

// 分页处理
const onPage = (event: any) => {
    page.value = event.page + 1
    pageSize.value = event.rows
    loadAdmins()
}

// 排序处理
const onSort = (event: any) => {
    sortField.value = event.sortField
    sortOrder.value = event.sortOrder
    loadAdmins()
}

// 搜索处理
const handleSearch = () => {
    page.value = 1
    loadAdmins()
}

// 筛选处理
const handleFilter = () => {
    page.value = 1
    loadAdmins()
}

// 显示编辑对话框
const showEditDialog = (admin: Admin) => {
    editingAdmin.value = admin
    adminForm.value = {
        username: admin.username,
        email: admin.email,
        phone: admin.phone,
        realName: admin.realName,
        password: '',
        role: admin.role,
        permissions: [...admin.permissions],
        status: admin.status,
        remark: admin.remark,
        department: admin.department,
        position: admin.position
    }
    showCreateDialog.value = true
}

// 关闭对话框
const closeDialog = () => {
    showCreateDialog.value = false
    editingAdmin.value = null
    adminForm.value = {
        username: '',
        email: '',
        phone: '',
        realName: '',
        password: '',
        role: 'operator',
        permissions: [],
        status: 'active',
        remark: '',
        department: '',
        position: ''
    }
}

// 保存管理员
const saveAdmin = async () => {
    if (!isFormValid.value) {
        toast.add({ severity: 'warn', summary: '警告', detail: '请填写必填字段', life: 1000 })
        return
    }

    try {
        saving.value = true

        if (editingAdmin.value) {
            // 更新
            toast.add({ severity: 'success', summary: '成功', detail: '更新管理员成功', life: 1000 })
        } else {
            // 创建
            toast.add({ severity: 'success', summary: '成功', detail: '创建管理员成功' })
        }

        closeDialog()
        loadAdmins()
    } catch (error) {
        console.error('保存管理员失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: '保存管理员失败' })
    } finally {
        saving.value = false
    }
}

// 确认删除
const confirmDelete = (admin: Admin) => {
    confirm.require({
        message: `确定要删除管理员 "${admin.realName}" 吗？`,
        header: '删除确认',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => deleteAdmin(admin.id)
    })
}

// 删除管理员
const deleteAdmin = async (id: number) => {
    try {
        toast.add({ severity: 'success', summary: '成功', detail: '删除管理员成功' })
        loadAdmins()
    } catch (error) {
        console.error('删除管理员失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: '删除管理员失败' })
    }
}

// 切换管理员状态
const toggleAdminStatus = async (admin: Admin) => {
    try {
        const newStatus = admin.status === 'active' ? 'inactive' : 'active'
        admin.status = newStatus
        toast.add({
            severity: 'success',
            summary: '成功',
            detail: `${newStatus === 'active' ? '启用' : '禁用'}管理员成功`
        })
        loadAdmins()
    } catch (error) {
        console.error('切换管理员状态失败:', error)
        toast.add({ severity: 'error', summary: '错误', detail: '切换管理员状态失败' })
    }
}

// 重置密码
const resetPassword = async (admin: Admin) => {
    confirm.require({
        message: `确定要重置管理员 "${admin.realName}" 的密码吗？`,
        header: '重置密码确认',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                // 模拟API调用
                await new Promise(resolve => setTimeout(resolve, 500))
                toast.add({ severity: 'success', summary: '成功', detail: '密码重置成功，新密码已发送到管理员邮箱' })
            } catch (error) {
                console.error('重置密码失败:', error)
                toast.add({ severity: 'error', summary: '错误', detail: '重置密码失败' })
            }
        }
    })
}

// 获取状态标签样式
const getStatusSeverity = (status: AdminStatus) => {
    const severityMap = {
        active: 'success',
        inactive: 'warning',
        locked: 'danger'
    }
    return severityMap[status] || 'secondary'
}

const getRoleSeverity = (role: AdminRole) => {
    const severityMap = {
        super_admin: 'danger',
        admin: 'warning',
        operator: 'info',
        viewer: 'secondary'
    }
    return severityMap[role] || 'secondary'
}

// 获取状态文本
const getStatusText = (status: AdminStatus) => {
    const textMap = {
        active: '正常',
        inactive: '禁用',
        locked: '锁定'
    }
    return textMap[status] || status
}

const getRoleText = (role: AdminRole) => {
    const textMap = {
        super_admin: '超级管理员',
        admin: '管理员',
        operator: '操作员',
        viewer: '查看者'
    }
    return textMap[role] || role
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

// 导出管理员
const exportAdmins = () => {
    toast.add({ severity: 'info', summary: '提示', detail: '导出功能开发中...' })
}

// 组件挂载时加载数据
onMounted(() => {
    loadAdmins()
})
</script>

<template>
    <div class="admins-management">
        <!-- 页面标题和统计 -->
        <div class="header-section">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">管理员管理</h1>
                    <p class="text-gray-600 mt-1">管理系统管理员账户，包括权限分配、角色管理等</p>
                </div>
                <div class="flex gap-3">
                    <Button label="新增管理员" icon="pi pi-plus" @click="showCreateDialog = true" class="p-button-success" />
                    <Button label="导出管理员" icon="pi pi-download" @click="exportAdmins" class="p-button-outlined" />
                </div>
            </div>

            <!-- 统计卡片 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-blue-600">{{ adminStatistics.total }}</div>
                        <div class="text-sm text-gray-600">总管理员</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-green-600">{{ adminStatistics.active }}</div>
                        <div class="text-sm text-gray-600">正常状态</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-red-600">{{ adminStatistics.super_admin }}</div>
                        <div class="text-sm text-gray-600">超级管理员</div>
                    </template>
                </Card>
                <Card class="text-center">
                    <template #content>
                        <div class="text-2xl font-bold text-orange-600">{{ adminStatistics.admin }}</div>
                        <div class="text-sm text-gray-600">普通管理员</div>
                    </template>
                </Card>
            </div>

            <!-- 工具栏 -->
            <div class="flex justify-between items-center mb-4">
                <div class="flex gap-3">
                    <Button label="刷新" icon="pi pi-refresh" @click="loadAdmins" class="p-button-outlined"
                        size="small" />
                    <Button label="批量启用" icon="pi pi-check" class="p-button-outlined" size="small"
                        :disabled="!selectedAdmins.length" />
                    <Button label="批量禁用" icon="pi pi-times" class="p-button-outlined" size="small"
                        :disabled="!selectedAdmins.length" />
                </div>
                <div class="flex gap-3">
                    <InputText v-model="searchKeyword" placeholder="搜索用户名、姓名或邮箱..." class="w-64"
                        @input="handleSearch" />
                    <Dropdown v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value"
                        placeholder="筛选状态" class="w-32" @change="handleFilter" />
                    <Dropdown v-model="filterRole" :options="roleOptions" optionLabel="label" optionValue="value"
                        placeholder="筛选角色" class="w-32" @change="handleFilter" />
                    <Calendar v-model="filterDateRange" selectionMode="range" placeholder="创建日期范围" class="w-48"
                        @date-select="handleFilter" showIcon />
                </div>
            </div>
        </div>

        <!-- 管理员数据表格 -->
        <div class="table-section">
            <DataTable :value="admins" tableStyle="min-width: 50rem" :loading="loading"
                v-model:selection="selectedAdmins" dataKey="id" paginator :rows="pageSize"
                :rowsPerPageOptions="[5, 10, 20, 50]" :totalRecords="total" :lazy="true" @page="onPage" @sort="onSort"
                :sortField="sortField" :sortOrder="sortOrder" :first="(page - 1) * pageSize" class="p-datatable-sm"
                showGridlines responsiveLayout="scroll" selectionMode="multiple" :metaKeySelection="false">

                <template #header>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <span class="text-xl font-bold">管理员列表</span>
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
                            <Avatar v-else :label="data.realName.charAt(0)" size="large" shape="circle"
                                class="bg-blue-500 text-white" />
                        </div>
                    </template>
                </Column>

                <!-- 管理员信息列 -->
                <Column field="username" header="管理员信息" sortable class="w-[18%]">
                    <template #body="{ data }">
                        <div>
                            <p class="font-medium text-sm mb-1">{{ data.realName }}</p>
                            <p class="text-xs text-gray-600 mb-1">@{{ data.username }}</p>
                            <p class="text-xs text-gray-600">{{ data.email }}</p>
                            <p class="text-xs text-gray-500 mt-1">{{ data.department }} - {{ data.position }}</p>
                        </div>
                    </template>
                </Column>

                <!-- 联系方式列 -->
                <Column field="phone" header="联系方式" class="w-[12%]">
                    <template #body="{ data }">
                        <div>
                            <p class="text-sm">{{ data.phone }}</p>
                            <p class="text-xs text-gray-600 mt-1">登录{{ data.loginCount }}次</p>
                        </div>
                    </template>
                </Column>

                <!-- 角色权限列 -->
                <Column field="role" header="角色权限" class="w-[15%]">
                    <template #body="{ data }">
                        <div>
                            <Tag :value="getRoleText(data.role)" :severity="getRoleSeverity(data.role)"
                                class="text-xs mb-2" />
                            <div class="flex flex-wrap gap-1">
                                <Badge v-for="permission in data.permissions.slice(0, 2)" :key="permission"
                                    :value="permission.split('.')[0]" severity="info" class="text-xs" />
                                <Badge v-if="data.permissions.length > 2" :value="`+${data.permissions.length - 2}`"
                                    severity="secondary" class="text-xs" />
                            </div>
                        </div>
                    </template>
                </Column>

                <!-- 状态列 -->
                <Column field="status" header="状态" class="w-[10%]">
                    <template #body="{ data }">
                        <div class="flex items-center gap-2">
                            <ToggleSwitch v-model="data.status" :true-value="'active'" :false-value="'inactive'"
                                @change="toggleAdminStatus(data)" class="scale-75"
                                :disabled="data.role === 'super_admin'" />
                            <Tag :value="getStatusText(data.status)" :severity="getStatusSeverity(data.status)"
                                class="text-xs" />
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

                <!-- 创建信息列 -->
                <Column field="createdAt" header="创建信息" sortable class="w-[12%]">
                    <template #body="{ data }">
                        <div>
                            <p class="text-xs text-gray-600">{{ formatDate(data.createdAt) }}</p>
                            <p class="text-xs text-gray-500">by {{ data.createdBy }}</p>
                        </div>
                    </template>
                </Column>

                <!-- 操作列 -->
                <Column header="操作" class="w-[15%]">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button icon="pi pi-eye" @click="router.push(`/admin/admins/${data.id}`)"
                                class="p-button-info p-button-sm" v-tooltip.top="'查看详情'" />
                            <Button icon="pi pi-pencil" @click="showEditDialog(data)"
                                class="p-button-warning p-button-sm" v-tooltip.top="'编辑'"
                                :disabled="data.role === 'super_admin' && data.id !== 1" />
                            <Button icon="pi pi-key" @click="resetPassword(data)" class="p-button-secondary p-button-sm"
                                v-tooltip.top="'重置密码'" />
                            <Button icon="pi pi-trash" @click="confirmDelete(data)" class="p-button-danger p-button-sm"
                                v-tooltip.top="'删除'" :disabled="data.role === 'super_admin'" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- 创建/编辑管理员对话框 -->
        <Dialog v-model:visible="showCreateDialog" :header="editingAdmin ? '编辑管理员' : '新增管理员'" :modal="true"
            :closable="true" class="w-[800px]">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">用户名 *</label>
                        <InputText v-model="adminForm.username" placeholder="请输入用户名" class="w-full"
                            :class="{ 'p-invalid': !adminForm.username }" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">真实姓名 *</label>
                        <InputText v-model="adminForm.realName" placeholder="请输入真实姓名" class="w-full"
                            :class="{ 'p-invalid': !adminForm.realName }" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">邮箱 *</label>
                        <InputText v-model="adminForm.email" placeholder="请输入邮箱" class="w-full"
                            :class="{ 'p-invalid': !adminForm.email }" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">手机号</label>
                        <InputText v-model="adminForm.phone" placeholder="请输入手机号" class="w-full" />
                    </div>

                    <div v-if="!editingAdmin">
                        <label class="block text-sm font-medium mb-2">密码 *</label>
                        <Password v-model="adminForm.password" placeholder="请输入密码" class="w-full"
                            :class="{ 'p-invalid': !adminForm.password }" toggleMask />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium mb-2">部门</label>
                            <Dropdown v-model="adminForm.department" :options="departmentOptions" optionLabel="label"
                                optionValue="value" placeholder="选择部门" class="w-full" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">职位</label>
                            <InputText v-model="adminForm.position" placeholder="请输入职位" class="w-full" />
                        </div>
                    </div>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">角色</label>
                        <Dropdown v-model="adminForm.role" :options="adminRoleOptions" optionLabel="label"
                            optionValue="value" placeholder="选择角色" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">权限</label>
                        <MultiSelect v-model="adminForm.permissions" :options="permissionOptions" optionLabel="label"
                            optionValue="value" placeholder="选择权限" class="w-full" display="chip" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">状态</label>
                        <Dropdown v-model="adminForm.status" :options="adminStatusOptions" optionLabel="label"
                            optionValue="value" placeholder="选择状态" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">备注</label>
                        <Textarea v-model="adminForm.remark" placeholder="请输入备注" rows="5" class="w-full" />
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <Button label="取消" @click="closeDialog" class="p-button-text" />
                    <Button :label="editingAdmin ? '更新' : '创建'" @click="saveAdmin" :loading="saving"
                        :disabled="!isFormValid" />
                </div>
            </template>
        </Dialog>

        <!-- 确认对话框 -->
        <ConfirmDialog />
    </div>
</template>

<style scoped>
.admins-management {
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