import NextLink from "next/link";
import { useRouter } from "next/router";
import classNames from "classnames";
import { ReactNode, FunctionComponent } from "react";
import { UrlObject } from "url";
declare type Url = string | UrlObject;

interface LinkProps {
  children: ReactNode;
  href: Url;
  type?: "internal" | "external";
  className?: string;
  currentClassName?: string;
  onClick?: () => void;
  newWindow?: boolean;
}

const Link: FunctionComponent<LinkProps> = ({
  children,
  href,
  type,
  className,
  currentClassName = "",
  newWindow,
  onClick,
}) => {
  const router = useRouter();
  const { asPath } = router;
  const isCurrent = asPath
    .replace("/", "")
    .includes(href.toString().replace("/", ""));

  const classes = classNames(className, {
    [currentClassName]: isCurrent,
  });

  if (type === "external") {
    return (
      <a
        className={classes}
        href={href?.toString()}
        target={newWindow ? "_blank" : undefined}
        rel="noreferrer"
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  return (
    <NextLink href={href} scroll>
      <a
        className={classes}
        href={href.toString()}
        target={newWindow ? "_blank" : undefined}
        rel="noreferrer"
        onClick={onClick}
      >
        {children}
      </a>
    </NextLink>
  );
};

export default Link;
