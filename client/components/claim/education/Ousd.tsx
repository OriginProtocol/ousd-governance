import { FunctionComponent, Dispatch, SetStateAction } from "react";
import TokenIcon from "components/TokenIcon";
import Video from "components/Video";
import Quiz from "components/claim/education/Quiz";
import CardGroup from "components/CardGroup";
import Card from "components/Card";

interface OusdProps {
  onComplete?: () => void;
}

const questions = [
  {
    question: "Which best describes OUSD?",
    answers: [
      "An algorithmic stablecoin",
      "A governance token",
      "A fully backed stablecoin that generates yield",
      "A staking token",
    ],
    correctAnswer: "A fully backed stablecoin that generates yield",
  },
  {
    question: "How do you earn yield with OUSD?",
    answers: [
      "You get OGV for locking it up",
      "The balance grows automatically in your wallet",
      "You stake it in the Origin Vault",
      "The price goes up over time",
    ],
    correctAnswer: "The balance grows automatically in your wallet",
  },
  {
    question: "Who manages OUSD's funds?",
    answers: [
      "Origin Protocol's team of Internet pioneers",
      "Every token holder chooses a strategy",
      "An elite group of ex-Wall Street traders",
      "A transparent set of automated smart contracts",
    ],
    correctAnswer: "A transparent set of automated smart contracts",
  },
];

const Ousd: FunctionComponent<OusdProps> = ({ onComplete }) => (
  <CardGroup>
    <Card>
      <div className="space-y-4">
        <div className="flex items-center space-x-1">
          <TokenIcon src="/ousd-coin.svg" alt="OUSD" />
          <h3 className="text-lg leading-6 font-medium">
            Origin Dollar (OUSD)
          </h3>
        </div>
        <Video id="W0SGakbCzLw" />
        <div className="text-sm lg:text-base text-gray-800 space-y-4">
          <p>
            Origin Dollar (OUSD) is a stablecoin that gives you access to some
            of the best yields in DeFi with none of the hassles.
          </p>
          <p>
            Stablecoins offer the benefits of cryptocurrencies without the price
            volatility.
          </p>
          <p>
            What separates OUSD from ordinary stablecoins is that it grows in
            your wallet every day. Not only does OUSD passively earn interest
            while you hold it, you can use it to make purchases and transfers
            anywhere around the world.
          </p>
          <p>
            OUSD&apos;s price is pegged to the dollar and it&apos;s backed 1:1
            by the most trusted collateral in crypto, which means it can be
            redeemed anytime.
          </p>
          <p>Simply put: imagine your wallet filled with OUSD bills.</p>
          <ul className="list-outside list-disc space-y-2 ml-4">
            <li>
              If you kept that OUSD in your wallet, then your wallet would fill
              with more OUSD every day.
            </li>
            <li>
              And if you wanted to take OUSD from your wallet to make a purchase
              or send it to a friend, you can do that too.
            </li>
          </ul>
          <p>It brings you the best of both worlds.</p>
        </div>
      </div>
    </Card>
    <Card>
      <Quiz
        questions={questions}
        onComplete={onComplete}
        onCompleteMessage="Continue to learn about OGV"
      />
    </Card>
  </CardGroup>
);

export default Ousd;
