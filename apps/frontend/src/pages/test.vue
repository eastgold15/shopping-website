<script setup>

</script>

<template>

  <div class="header flex  flex-row m-auto gap-2 items-center">
    <div class="text-black text-3xl flex-shrink-0">newera-fashions</div>
    <InputGroup>
      <InputText fluid class="mx-2"></InputText>
      <Button class="mx-2 text-white" icon="pi pi-search" iconClass="text-#F3C5A9"> </Button>
    </InputGroup>
    <div class="flex-grow"></div>


    <div class="px-2 bg-white flex-shrink-0 border-white hover:bg-black/20 rounded text-2xl">
      <div class="pi pi-user "> 1960825664</div>
    </div>

    <Tooltip>
      <template #trigger>
        <button class="w-40px">帮助</button>
      </template>
      这里是帮助提示内容！
    </Tooltip>
  </div>


  <div class="nav"></div>


  <div class="most_love_categories"></div>



  <div class="flash-sale"></div>


  <div class="recommendation_for_you"></div>


</template>