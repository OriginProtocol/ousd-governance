import { FunctionComponent, useState } from "react";
import classNames from "classnames";
import { Web3Button } from "components/Web3Button";
import Wrapper from "components/Wrapper";
import Link from "components/Link";
import Image from "next/image";
import { navItems } from "../constants";
import useClaim from "utils/useClaim";
import { getRewardsApy } from "utils/apy";

interface HeaderProps {
  hideNav?: boolean;
}

const Header: FunctionComponent<HeaderProps> = ({ hideNav }) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const claim = useClaim();

  const totalSupplyVeOgv = claim.staking.totalSupplyVeOgvAdjusted || 0;

  // Standard APY figure, assumes 100 OGV locked for max duration
  const stakingApy = getRewardsApy(
    100 * 1.8 ** (48 / 12),
    100,
    totalSupplyVeOgv
  );

  const overlayClassNames = classNames(
    "bg-black z-20 h-screen w-screen fixed top-0 transition duration-200 lg:hidden",
    {
      "opacity-0 -left-full": !menuIsOpen,
      "opacity-50 left-0": menuIsOpen,
    }
  );

  const mobileMenuClassNames = classNames(
    "flex flex-col pt-8 bg-white z-30 fixed top-0 h-screen w-72 transition transition-right duration-200 lg:hidden",
    {
      "-right-full": !menuIsOpen,
      "right-0": menuIsOpen,
    }
  );

  return (
    <>
      <header className="py-6 md:py-8 bg-secondary">
        <Wrapper>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-none -mb-3 mr-7 xl:mr-10">
                <Link href="/">
                  <Image
                    width="204"
                    height="29"
                    src="/logo.svg"
                    alt="OUSD Governance"
                  />
                </Link>
              </div>
              {!hideNav && (
                <ul className="space-x-7 xl:space-x-10 font-light h-0 invisible lg:h-auto lg:visible lg:flex">
                  {navItems.map(({ href, label, external }) => (
                    <li key={label}>
                      <Link
                        className="group text-sm text-white flex space-x-2"
                        currentClassName="font-normal"
                        href={href}
                        type={external ? "external" : "internal"}
                        newWindow={external}
                      >
                        <span className="group-hover:underline">{label}</span>
                        {href === "/stake" && (
                          <div className="flex items-center">
                            <div
                              className="w-0 h-0 
                              border-t-[0.25rem] border-t-transparent
                              border-r-[0.4rem] border-r-white
                              border-b-[0.25rem] border-b-transparent
                              opacity-10
                              "
                            />
                            <span className="text-xs bg-white bg-opacity-10 px-2 py-[0.2rem] rounded-sm font-bold">
                              {stakingApy.toFixed(2)}% vAPY
                            </span>
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {!hideNav && (
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
            )}
          </div>
        </Wrapper>
      </header>
      {!hideNav && (
        <>
          <div
            className={overlayClassNames}
            onClick={() => setMenuIsOpen(false)}
          />
          <div className={mobileMenuClassNames}>
            <button
              className="w-[18px] h-[17px] ml-auto mr-6"
              onClick={() => setMenuIsOpen(false)}
            >
              <Image
                width="18"
                height="17"
                src="/close-icon.svg"
                alt="Close Menu"
              />
            </button>
            <ul className="w-full text-2xl mt-6">
              {navItems.map(({ href, label, external }) => (
                <li key={label}>
                  <Link
                    className="px-6 py-3 hover:text-gray-700 text-black border-l-4 border-white flex space-x-2"
                    currentClassName="font-normal border-primary"
                    href={href}
                    onClick={
                      !external ? () => setMenuIsOpen(false) : () => null
                    }
                    type={external ? "external" : "internal"}
                    newWindow={external}
                  >
                    <span>{label}</span>
                    {href === "/stake" && (
                      <div className="flex items-center">
                        <div
                          className="w-0 h-0 
                              border-t-[0.25rem] border-t-transparent
                              border-r-[0.4rem] border-r-primary
                              border-b-[0.25rem] border-b-transparent
                              opacity-100
                              "
                        />
                        <span className="text-xs bg-primary bg-opacity-100 px-2 py-[0.2rem] rounded-sm !font-light text-white">
                          {stakingApy.toFixed(2)}% vAPY
                        </span>
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
