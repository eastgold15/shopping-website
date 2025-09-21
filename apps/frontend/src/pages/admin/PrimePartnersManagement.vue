<script lang="ts" setup>

import type { InsertPartnersDto, ListImagesQueryDto, PartnerlFormDto, PartnersListVo, SelectImagesVo } from "@backend/types";
import { genPrimeCmsTemplateData } from "@frontend/composables/cms/usePrimeTemplateGen";
import type { CrudMode } from "@frontend/types/prime-cms";
import { formatDate, getImageUrl } from "@frontend/utils/formatUtils";
import { useCmsApi } from "@frontend/utils/handleApi";
import { FormField } from "@primevue/forms";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import RadioButton from "primevue/radiobutton";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import { useToast } from "primevue/usetoast";
import { computed, onMounted, ref } from "vue";
import { z } from "zod";




</script>

<template>
  <PrimeCrudTemplate ref="crudTemplateRef" name="合作伙伴" identifier="partner" :table-data="tableData"
    :template-data="templateData" :crud-controller="15" :query-form="queryForm" :resolver="resolver"
    :query-resolver="queryResolver">
    <!-- 查询表单 -->
    <template #QueryForm>
   
    </template>

    <!-- 表格列 -->
    <template #TableColumn>
    
    </template>

    <!-- 表单 -->
    <template
      #CrudForm="{ data, mode, disabled, $form }: { data: PartnersListVo, mode: CrudMode, disabled: boolean, $form: any }">
    
    </template>
  </PrimeCrudTemplate>

</template>

<style scoped>
/* 文本截断样式 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 确保表单项有合适的间距 */
.flex.flex-column.gap-3>* {
  margin-bottom: 0.5rem;
}
</style>