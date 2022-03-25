import { Web3Button } from "components/Web3Button";
import Link from "next/link";
import Image from "next/image";

export default function Layout({ children }: JSX.ElementChildrenAttribute) {
  return (
    <div className="flex flex-col justify-between max-w-7xl mx-auto md:pt-10 md:px-6 min-h-screen">
      <div className="navbar mb-2 shadow-lg bg-neutral text-neutral-content md:rounded-box">
        <div className="flex-none px-2 mx-2">
          <Link href="/" passHref>
            <Image
              className="w-8 h-8"
              src="https://ousd.com/images/ousd-coin.svg"
              alt="OUSD Governance"
            />
          </Link>
        </div>
        <div className="flex-1 px-2 mx-2">
          <div className="items-stretch">
            <Link href="/proposal" passHref>
              <a className="btn btn-ghost btn-sm rounded-btn">Proposals</a>
            </Link>
            <Link href="/leaderboard" passHref>
              <a className="btn btn-ghost btn-sm rounded-btn">Leaderboard</a>
            </Link>
            <Link href="/vote-escrow" passHref>
              <a className="btn btn-ghost btn-sm rounded-btn">Vote Escrow</a>
            </Link>
          </div>
        </div>
        <div className="flex-none pr-4">
          <Web3Button />
        </div>
      </div>
      <div className="px-4 sm:px-6 md:px-8 py-12 mb-auto">{children}</div>
    </div>
  );
}
