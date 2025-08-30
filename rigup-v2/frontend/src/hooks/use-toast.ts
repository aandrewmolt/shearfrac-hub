
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

// Lazy initialization to prevent module initialization issues
let count: number | null = null;

function getCount() {
  if (count === null) {
    count = 0;
  }
  return count;
}

function genId() {
  let currentCount = getCount();
  currentCount = (currentCount + 1) % Number.MAX_SAFE_INTEGER;
  count = currentCount;
  return currentCount.toString();
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

// Lazy initialization for toast timeouts
let toastTimeouts: Map<string, ReturnType<typeof setTimeout>> | null = null;

function getToastTimeouts() {
  if (!toastTimeouts) {
    toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  }
  return toastTimeouts;
}

const addToRemoveQueue = (toastId: string) => {
  const timeouts = getToastTimeouts();
  if (timeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    timeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  timeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

// Lazy initialization for listeners and memory state
let listeners: Array<(state: State) => void> | null = null;
let memoryState: State | null = null;

function getListeners() {
  if (!listeners) {
    listeners = [];
  }
  return listeners;
}

function getMemoryState() {
  if (!memoryState) {
    memoryState = { toasts: [] };
  }
  return memoryState;
}

function dispatch(action: Action) {
  memoryState = reducer(getMemoryState(), action);
  getListeners().forEach((listener) => {
    listener(memoryState!);
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(getMemoryState())

  React.useEffect(() => {
    const currentListeners = getListeners();
    currentListeners.push(setState)
    return () => {
      const index = currentListeners.indexOf(setState)
      if (index > -1) {
        currentListeners.splice(index, 1)
      }
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
