import { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
};

export default function Container({
  children,
}: ContainerProps) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1280px",
        margin: "0 auto",
        paddingInline: "1.5rem",
      }}
    >
      {children}
    </div>
  );
}