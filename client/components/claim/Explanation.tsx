import { FunctionComponent, useState } from "react";
import { SectionTitle } from "components/SectionTitle";
import Card from "components/Card";
import SlideTracker from "components/SlideTracker";
import SlideControls from "@/components/SlideControls";
import Ogn from "components/claim/explanation/Ogn";
import Ousd from "components/claim/explanation/Ousd";
import Ogv from "components/claim/explanation/Ogv";
import VeOgv from "components/claim/explanation/VeOgv";

interface ExplanationProps {}

const Explanation: FunctionComponent<ExplanationProps> = () => {
  const [currentProduct, setCurrentProduct] = useState(0);
  const products = ["$OGN", "$OUSD", "$OGV", "$veOGV"];

  const handleChangeProduct = (dot: number) => setCurrentProduct(dot);
  const handleNextSlide = () => setCurrentProduct(currentProduct + 1);
  const handlePrevSlide = () => setCurrentProduct(currentProduct - 1);

  return (
    <Card>
      <SectionTitle>Origin products</SectionTitle>
      <p className="text-sm text-gray-600 mb-4">
        If your wallet is eligible, you&apos;ll be able to claim your OGV/veOGV
        soon. But first, here&apos;s more about the tokens that drive the
        protocol and their benefits.
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
  );
};
export default Explanation;
