import React from "react";
import { Link } from "react-router";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  to?: string;
  href?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      to,
      href,
      icon,
      iconRight,
      loading = false,
      className = "",
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
      sm: {
        minHeight: "36px",
        padding: "0 14px",
        fontSize: "13px",
      },
      md: {
        minHeight: "44px",
        padding: "0 22px",
        fontSize: "14px",
      },
      lg: {
        minHeight: "52px",
        padding: "0 28px",
        fontSize: "15px",
      },
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary: "button--primary",
      secondary: "button--secondary",
      quiet: "button--quiet",
      danger: "button--danger",
      ghost: "button--ghost",
    };

    const combinedClassName = `button ${variantClasses[variant]} button--${size} ${className}`;
    const combinedStyle = { ...sizeStyles[size], ...style };

    const content = (
      <>
        {loading ? (
          <span
            aria-hidden="true"
            style={{
              width: "14px",
              height: "14px",
              border: "2px solid currentColor",
              borderRightColor: "transparent",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.6s linear infinite",
            }}
          />
        ) : (
          icon && <span className="button__icon">{icon}</span>
        )}
        <span>{children}</span>
        {!loading && iconRight && <span className="button__icon-right">{iconRight}</span>}
      </>
    );

    if (to) {
      return (
        <Link
          to={to}
          className={combinedClassName}
          style={combinedStyle}
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...(props as any)}
        >
          {content}
        </Link>
      );
    }

    if (href) {
      return (
        <a
          href={href}
          className={combinedClassName}
          style={combinedStyle}
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...(props as any)}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={disabled || loading}
        className={combinedClassName}
        style={combinedStyle}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
