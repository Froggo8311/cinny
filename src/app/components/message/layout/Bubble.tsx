import React, { ReactNode } from 'react';
import { Box, as } from 'folds';
import * as css from './layout.css';

type BubbleLayoutProps = {
  avatar?: ReactNode;
  header?: ReactNode;
  content: ReactNode;
};

export const BubbleLayout = as<'div', BubbleLayoutProps>(
  ({ avatar, header, content, ...props }, ref) => (
    <Box alignItems="Start" gap="300" {...props} ref={ref}>
      <Box className={css.BubbleAvatar} shrink="No">
        {avatar}
      </Box>
      <Box className={css.BubbleContent} direction="Column">
        {header}
        {content}
      </Box>
    </Box>
  )
);
