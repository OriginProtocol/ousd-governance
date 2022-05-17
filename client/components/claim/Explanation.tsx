import { FunctionComponent, useState } from "react";
import { SectionTitle } from "components/SectionTitle";
import Card from "components/Card";
import SlideTracker from "components/SlideTracker";
import SlideControls from "components/SlideControls";
import Button from "components/Button";
import Ogn from "components/claim/explanation/Ogn";
import Ousd from "components/claim/explanation/Ousd";
import Ogv from "components/claim/explanation/Ogv";
import VeOgv from "components/claim/explanation/VeOgv";

interface ExplanationProps {
  handleNextStep: () => void;
}

const Explanation: FunctionComponent<ExplanationProps> = ({
  handleNextStep,
}) => {
  const [currentProduct, setCurrentProduct] = useState(0);
  const products = ["OGN", "OUSD", "OGV", "veOGV"];

  const handleChangeProduct = (dot: number) => setCurrentProduct(dot);
  const handleNextSlide = () => setCurrentProduct(currentProduct + 1);
  const handlePrevSlide = () => setCurrentProduct(currentProduct - 1);

  const canAdvance = currentProduct === products.length - 1;

  return (
    <>
      <Card>
        <SectionTitle>Origin Products</SectionTitle>
        <p className="text-sm text-gray-600 mb-4">
          If your wallet is eligible, you&apos;ll be able to claim your
          OGV/veOGV soon. But first, here&apos;s more about the tokens that
          drive the protocol and their benefits.
        </p>
        <div className="space-y-2">
          <SlideTracker
            currentSlide={currentProduct}
            slides={products}
            onDotClick={handleChangeProduct}
          />
          <Card alt>
            {currentProduct === 0 && <Ogn />}
            {currentProduct === 1 && <Ousd />}
            {currentProduct === 2 && <Ogv />}
            {currentProduct === 3 && <VeOgv />}
          </Card>
          <SlideControls
            currentSlide={currentProduct}
            slides={products}
            handleNextSlide={handleNextSlide}
            handlePrevSlide={handlePrevSlide}
          />
        </div>
      </Card>
      <div className="mt-6 flex">
        <div className="ml-auto">
          <Button onClick={handleNextStep} disabled={!canAdvance}>
            Check your eligibility &rarr;
          </Button>
        </div>
      </div>
    </>
  );
};
export default Explanation;
