import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from './index';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl border border-gray-100 focus:outline-none max-h-[90vh] overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <Dialog.Title className="text-lg font-bold text-gray-900">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          
          <div className="flex-1 text-sm text-gray-600">{children}</div>
          
          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4 mt-6">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
