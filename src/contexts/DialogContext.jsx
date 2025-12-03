import { Dialog, Transition } from "@headlessui/react";
import { createContext, useContext, useState, Fragment } from "react";

const DialogContext = createContext();

export function useDialog() {
    return useContext(DialogContext);
}

export function DialogProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState(null);

    function openDialog(newTitle, newContent) {
        setTitle(newTitle);
        setContent(newContent);
        setIsOpen(true);
    }

    function closeDialog() {
        setIsOpen(false);
    }

    const value = {
        openDialog,
        closeDialog,
    };

    return (
        <DialogContext.Provider value={value}>
            {children}
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeDialog}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-card border border-border p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-bold leading-6 text-white border-b border-border pb-3 mb-4"
                                    >
                                        {title}
                                    </Dialog.Title>
                                    <div className="mt-2 text-white/90 max-h-[70vh] overflow-y-auto scrollbar-hide pr-2">
                                        {content}
                                    </div>

                                    <div className="mt-4 border-t border-border pt-3">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            onClick={closeDialog}
                                        >
                                            Got it, close!
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </DialogContext.Provider>
    );
}