import { computed, defineComponent, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VAppBarTitle, VIcon } from 'vuetify/components'

/**
 * 라우터 기반 comment/icon 추출 훅
 */
export function usePageMeta() {
  const route = useRoute();
  const router = useRouter();

  const matched = computed(() =>
    router.options.routes.find(r => r.path === route.path) || {}
  );

  const comment = computed(() => matched.value.comment || '페이지');
  const icon = computed(() => matched.value.icon || 'mdi-apps');

  return { comment, icon };
}

/**
 * 공통 <v-app-bar-title> 컴포넌트
 */
export const AppBarTitle = defineComponent({
  name: 'AppBarTitle',
  props: {
    onIconClick: Function,
    refreshIcon: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const { comment, icon } = usePageMeta();

    const computedIcon = computed(() => props.refreshIcon || icon.value);

    return () =>
      h(
        VAppBarTitle,
        {},
        {
          default: () => [
            h(
              VIcon,
              {
                onClick: props.onIconClick,
                class: 'me-2',
                style: { cursor: 'pointer' },
              },
              () => computedIcon.value
            ),
            comment.value,
          ],
        }
      );
  }
});
