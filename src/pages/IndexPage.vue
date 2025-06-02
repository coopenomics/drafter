<template>
  <q-page>
    <div class="row">
      <updateButton class="col-4"/>
      <templateUploader class="col-4"/>
      <downloadButton class="col-4"/>
    </div>
    <div class="row" >
      <htmlEditor class="col-4 q-pa-md scrolled" />
      <modelViewer class="col-4 q-pa-md scrolled"/>
      <htmlPreview class="col-4 q-pa-md scrolled"/>
    </div>
  </q-page>
</template>

<script setup lang="ts">
// import { ref } from 'vue';
// import { Meta } from 'components/models';
import htmlPreview from 'src/components/htmlPreview.vue';
import updateButton from 'src/components/updateButton.vue';
import downloadButton from 'src/components/downloadButton.vue';
import templateUploader from 'src/components/templateUploader.vue';
import htmlEditor from 'src/components/htmlEditor.vue';
import modelViewer from 'src/components/modelViewer.vue';

defineOptions({
  name: 'IndexPage',
});

// const meta = ref<Meta>({
//   totalCount: 1200,
// });
</script>
<style>
.scrolled{
  max-height: 90vh;
  overflow-y: scroll;
}
</style>
