import {
  BookCopy,
  BookOpenText,
  FilePlus,
  FileText,
  FolderKanban,
  Globe,
  HeartPulse,
  Layers3,
  ListTodo,
  MessagesSquare,
  Mic,
  Rocket,
} from "lucide-react";

const iconMap = {
  BookCopy,
  BookOpenText,
  FilePlus,
  FileText,
  FolderKanban,
  Globe,
  HeartPulse,
  Layers3,
  ListTodo,
  MessagesSquare,
  Mic,
  Rocket,
};

export const resolveWorkspaceIcon = (iconName) => iconMap[iconName] || FileText;
