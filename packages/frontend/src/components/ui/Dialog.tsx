import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import clsx from 'clsx';
import * as dialogStyles from '../../styles/dialog.css';

type DialogSize = keyof typeof dialogStyles.contentSizes;

type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  size?: DialogSize;
};

type DialogSectionProps = {
  className?: string;
  children: React.ReactNode;
};

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={clsx(dialogStyles.overlay, className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, size = 'md', ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={clsx(
        dialogStyles.content,
        dialogStyles.contentSizes[size],
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className={dialogStyles.closeButton} aria-label="Close dialog">
        <span className={dialogStyles.closeIcon} aria-hidden="true" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader: React.FC<DialogSectionProps> = ({ className, children }) => (
  <div className={clsx(dialogStyles.header, className)}>
    {children}
  </div>
);

export const DialogBody: React.FC<DialogSectionProps> = ({ className, children }) => (
  <div className={clsx(dialogStyles.body, className)}>
    {children}
  </div>
);

export const DialogFooter: React.FC<DialogSectionProps> = ({ className, children }) => (
  <div className={clsx(dialogStyles.footer, className)}>
    {children}
  </div>
);

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={clsx(dialogStyles.title, className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={clsx(dialogStyles.description, className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export interface UseDialogState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function useDialogState(initialOpen = false): UseDialogState {
  const [open, setOpen] = React.useState(initialOpen);
  return { open, setOpen };
}
