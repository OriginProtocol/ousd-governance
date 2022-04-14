import { FunctionComponent, useState } from "react";
import classNames from "classnames";
import { Web3Button } from "components/Web3Button";
import Wrapper from "components/Wrapper";
import Link from "components/Link";
import Image from "next/image";
import { navItems } from "../constants";

const Header: FunctionComponent = () => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);

  const overlayClassNames = classNames(
    "bg-black z-20 h-screen w-screen fixed top-0 transition duration-200 lg:hidden",
    {
      "opacity-0 -left-full": !menuIsOpen,
      "opacity-50 left-0": menuIsOpen,
    }
  );

  const mobileMenuClassNames = classNames(
    "flex bg-white z-30 fixed top-0 h-screen w-72 transition transition-right duration-200 lg:hidden",
    {
      "-right-full": !menuIsOpen,
      "right-0": menuIsOpen,
    }
  );

  return (
    <>
      <header className="py-6 md:py-8 mb-2 bg-neutral text-neutral-content">
        <Wrapper>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-none -mb-3 mr-16">
                <Link href="/">
                  <Image
                    width="204"
                    height="29"
                    src="/logo.svg"
                    alt="OUSD Governance"
                  />
                </Link>
              </div>
              <ul className="space-x-10 font-light hidden lg:flex">
                {navItems.map(({ href, label }) => (
                  <li key={label}>
                    <Link
                      className="text-sm text-white hover:underline"
                      currentClassName="font-semibold"
                      href={href}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-none flex items-center space-x-3 md:space-x-4">
              <button
                className="flex lg:hidden"
                onClick={() => setMenuIsOpen(true)}
              >
                <Image
                  width="25"
                  height="19"
                  src="/menu-icon.svg"
                  alt="Open Menu"
                />
              </button>
              <Web3Button />
            </div>
          </div>
        </Wrapper>
      </header>
      <div className={overlayClassNames} onClick={() => setMenuIsOpen(false)} />
      <div className={mobileMenuClassNames}>
        <button
          className="absolute top-10 right-6"
          onClick={() => setMenuIsOpen(false)}
        >
          <Image
            width="18"
            height="17"
            src="/close-icon.svg"
            alt="Close Menu"
          />
        </button>
        <ul className="mt-auto w-full text-2xl mb-10">
          {navItems.map(({ href, label }) => (
            <li key={label}>
              <Link
                className="px-6 py-3 block hover:text-gray-700 text-black border-l-4 border-white"
                currentClassName="font-semibold border-primary"
                href={href}
                onClick={() => setMenuIsOpen(false)}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Header;
