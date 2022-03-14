import { Web3Button } from "components/Web3Button";

export default function Layout({ children }: JSX.ElementChildrenAttribute) {
  return (
    <div className="flex flex-col justify-between max-w-7xl mx-auto md:pt-10 md:px-6 min-h-screen">
      <div className="navbar mb-2 shadow-lg bg-neutral text-neutral-content md:rounded-box">
        <div className="flex-none px-2 mx-2">
          <img
            className="w-8 h-8"
            src="https://ousd.com/images/ousd-coin.svg"
          />
        </div>
        <div className="flex-1 px-2 mx-2">
          <div className="items-stretch">
            <a href="/" className="btn btn-ghost btn-sm rounded-btn">
              Overview
            </a>
            <a href="/proposal" className="btn btn-ghost btn-sm rounded-btn">
              Proposals
            </a>
            <a href="/leaderboard" className="btn btn-ghost btn-sm rounded-btn">
              Leaderboard
            </a>
            <a href="/vote-escrow" className="btn btn-ghost btn-sm rounded-btn">
              Vote Escrow
            </a>
          </div>
        </div>
        <div className="flex-none pr-4">
          <Web3Button />
        </div>
      </div>
      <div className="px-4 sm:px-6 md:px-8 py-12 mb-auto">{children}</div>
      {/*
      <footer className="p-10 footer bg-neutral text-neutral-content md:rounded-box mb-12">
        <div>
          <span className="footer-title">Origin Protocol</span>
          <a
            href="https://originprotocol.com"
            className="link link-hover"
            target="_blank"
          >
            Website
          </a>
          <a href="" className="link link-hover" target="_blank">
            Discord
          </a>
        </div>
        <div>
          <span className="footer-title">OUSD</span>
          <a
            href="https://docs.ousd.com"
            className="link link-hover"
            target="_blank"
          >
            Docs
          </a>
          <a
            href="https://ousd.com"
            className="link link-hover"
            target="_blank"
          >
            Mint
          </a>
        </div>
      </footer>
      */}
    </div>
  );
}
