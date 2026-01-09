#!/usr/bin/env python3
"""
Sentiment Analysis Service for Vietnamese Reviews
Lexicon-based + Aspect-based sentiment analysis for VLXD reviews

API Endpoints:
    POST /sentiment/analyze - Analyze sentiment of review text
"""

import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

# Import lexicon
from vietnamese_lexicon import (
    POSITIVE_WORDS,
    NEGATIVE_WORDS,
    INTENSIFIERS,
    DIMINISHERS,
    NEGATORS,
    ASPECT_KEYWORDS,
    get_word_sentiment,
    get_modifier_value,
    get_aspect
)

# Try to import underthesea for Vietnamese tokenization
try:
    from underthesea import word_tokenize
    HAS_UNDERTHESEA = True
except ImportError:
    HAS_UNDERTHESEA = False
    print("⚠️ underthesea not installed. Using basic tokenization.")


@dataclass
class SentimentResult:
    """Result of sentiment analysis"""
    sentiment: str  # POSITIVE, NEGATIVE, NEUTRAL
    score: float    # -1.0 to 1.0
    confidence: float  # 0.0 to 1.0
    aspects: Dict[str, Dict]
    keywords: Dict[str, List[str]]
    

class SentimentAnalyzer:
    """Vietnamese Sentiment Analyzer using lexicon-based approach"""
    
    def __init__(self):
        self.positive_words = POSITIVE_WORDS
        self.negative_words = NEGATIVE_WORDS
        self.intensifiers = INTENSIFIERS
        self.diminishers = DIMINISHERS
        self.negators = NEGATORS
    
    def tokenize(self, text: str) -> List[str]:
        """Tokenize Vietnamese text"""
        if HAS_UNDERTHESEA:
            return word_tokenize(text, format="text").split()
        else:
            # Basic tokenization fallback
            text = text.lower()
            text = re.sub(r'[^\w\s]', ' ', text)
            return text.split()
    
    def preprocess(self, text: str) -> str:
        """Preprocess text for analysis"""
        # Normalize
        text = text.lower().strip()
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        return text
    
    def _find_modifiers_around(self, tokens: List[str], position: int, window: int = 2) -> Tuple[float, str]:
        """
        Find modifiers around a word position
        Returns (modifier_value, modifier_type)
        """
        combined_modifier = 1.0
        modifier_type = None
        
        # Look at previous tokens within window
        start = max(0, position - window)
        for i in range(start, position):
            token = tokens[i]
            mod_type, mod_value = get_modifier_value(token)
            
            if mod_type == "negator":
                combined_modifier *= mod_value
                modifier_type = "negator"
            elif mod_type == "intensifier":
                combined_modifier *= mod_value
                modifier_type = modifier_type or "intensifier"
            elif mod_type == "diminisher":
                combined_modifier *= mod_value
                modifier_type = modifier_type or "diminisher"
        
        return combined_modifier, modifier_type
    
    def analyze(self, text: str, include_aspects: bool = True) -> SentimentResult:
        """
        Analyze sentiment of text
        
        Args:
            text: Vietnamese text to analyze
            include_aspects: Whether to include aspect-level analysis
            
        Returns:
            SentimentResult with sentiment classification and details
        """
        preprocessed = self.preprocess(text)
        tokens = self.tokenize(preprocessed)
        
        # Track sentiment scores
        positive_scores = []
        negative_scores = []
        positive_keywords = []
        negative_keywords = []
        
        # Analyze each token
        for i, token in enumerate(tokens):
            sentiment_value, is_positive = get_word_sentiment(token)
            
            if sentiment_value != 0:
                # Find modifiers
                modifier, mod_type = self._find_modifiers_around(tokens, i)
                final_value = sentiment_value * modifier
                
                if is_positive:
                    if modifier < 0:  # Negated
                        negative_scores.append(abs(final_value))
                        negative_keywords.append(token)
                    else:
                        positive_scores.append(final_value)
                        positive_keywords.append(token)
                else:
                    if modifier < 0:  # Double negative = positive
                        positive_scores.append(abs(final_value))
                        positive_keywords.append(token)
                    else:
                        negative_scores.append(abs(final_value))
                        negative_keywords.append(token)
        
        # Also check for compound words (bigrams)
        for i in range(len(tokens) - 1):
            bigram = f"{tokens[i]} {tokens[i+1]}"
            sentiment_value, is_positive = get_word_sentiment(bigram)
            
            if sentiment_value != 0:
                modifier, _ = self._find_modifiers_around(tokens, i)
                final_value = sentiment_value * modifier
                
                if is_positive:
                    if modifier < 0:
                        negative_scores.append(abs(final_value))
                    else:
                        positive_scores.append(final_value)
                        positive_keywords.append(bigram)
                else:
                    if modifier < 0:
                        positive_scores.append(abs(final_value))
                    else:
                        negative_scores.append(abs(final_value))
                        negative_keywords.append(bigram)
        
        # Calculate overall score
        total_positive = sum(positive_scores) if positive_scores else 0
        total_negative = sum(negative_scores) if negative_scores else 0
        
        if total_positive + total_negative == 0:
            # No sentiment words found
            score = 0.0
            confidence = 0.3
        else:
            # Normalized score: (pos - neg) / (pos + neg)
            score = (total_positive - total_negative) / (total_positive + total_negative)
            # Confidence based on number of sentiment words
            num_words = len(positive_scores) + len(negative_scores)
            confidence = min(0.5 + (num_words * 0.1), 0.95)
        
        # Classify sentiment
        if score > 0.2:
            sentiment = "POSITIVE"
        elif score < -0.2:
            sentiment = "NEGATIVE"
        else:
            sentiment = "NEUTRAL"
        
        # Aspect analysis
        aspects = {}
        if include_aspects:
            aspects = self._analyze_aspects(text)
        
        return SentimentResult(
            sentiment=sentiment,
            score=round(score, 3),
            confidence=round(confidence, 3),
            aspects=aspects,
            keywords={
                "positive": list(set(positive_keywords)),
                "negative": list(set(negative_keywords))
            }
        )
    
    def _analyze_aspects(self, text: str) -> Dict[str, Dict]:
        """Analyze sentiment by aspect"""
        aspects = {}
        
        # Split into sentences
        sentences = re.split(r'[.!?,;]', text)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # Detect aspect
            aspect = get_aspect(sentence)
            if aspect:
                # Analyze sentiment of this sentence
                result = self.analyze(sentence, include_aspects=False)
                
                if aspect not in aspects:
                    aspects[aspect] = {
                        "sentiment": result.sentiment,
                        "score": result.score,
                        "mentions": 1
                    }
                else:
                    # Average with existing
                    existing = aspects[aspect]
                    new_score = (existing["score"] * existing["mentions"] + result.score) / (existing["mentions"] + 1)
                    aspects[aspect]["score"] = round(new_score, 3)
                    aspects[aspect]["mentions"] += 1
                    
                    # Update sentiment classification
                    if new_score > 0.2:
                        aspects[aspect]["sentiment"] = "POSITIVE"
                    elif new_score < -0.2:
                        aspects[aspect]["sentiment"] = "NEGATIVE"
                    else:
                        aspects[aspect]["sentiment"] = "NEUTRAL"
        
        return aspects


# Flask Blueprint for integration
def create_sentiment_blueprint():
    """Create Flask Blueprint for sentiment analysis"""
    from flask import Blueprint, request, jsonify
    
    bp = Blueprint('sentiment', __name__, url_prefix='/sentiment')
    analyzer = SentimentAnalyzer()
    
    @bp.route('/analyze', methods=['POST'])
    def analyze():
        """Analyze sentiment of text"""
        data = request.get_json() or {}
        text = data.get('text', '')
        
        if not text:
            return jsonify({
                "success": False,
                "error": "Missing 'text' field"
            }), 400
        
        options = data.get('options', {})
        include_aspects = options.get('includeAspects', True)
        
        try:
            result = analyzer.analyze(text, include_aspects)
            
            return jsonify({
                "success": True,
                "data": {
                    "sentiment": result.sentiment,
                    "score": result.score,
                    "confidence": result.confidence,
                    "aspects": result.aspects,
                    "keywords": result.keywords
                }
            })
        except Exception as e:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    
    @bp.route('/batch', methods=['POST'])
    def batch_analyze():
        """Analyze sentiment of multiple texts"""
        data = request.get_json() or {}
        texts = data.get('texts', [])
        
        if not texts:
            return jsonify({
                "success": False,
                "error": "Missing 'texts' array"
            }), 400
        
        results = []
        for text in texts:
            result = analyzer.analyze(text, include_aspects=True)
            results.append({
                "text": text[:100] + "..." if len(text) > 100 else text,
                "sentiment": result.sentiment,
                "score": result.score,
                "confidence": result.confidence
            })
        
        # Calculate summary
        positive_count = sum(1 for r in results if r["sentiment"] == "POSITIVE")
        negative_count = sum(1 for r in results if r["sentiment"] == "NEGATIVE")
        neutral_count = sum(1 for r in results if r["sentiment"] == "NEUTRAL")
        
        return jsonify({
            "success": True,
            "data": {
                "results": results,
                "summary": {
                    "total": len(results),
                    "positive": positive_count,
                    "negative": negative_count,
                    "neutral": neutral_count,
                    "positive_percent": round(positive_count / len(results) * 100, 1) if results else 0,
                    "negative_percent": round(negative_count / len(results) * 100, 1) if results else 0
                }
            }
        })
    
    return bp


if __name__ == "__main__":
    # Test
    analyzer = SentimentAnalyzer()
    
    test_reviews = [
        "Giao hàng rất nhanh, xi măng chất lượng tốt. Rất hài lòng!",
        "Giao hàng nhanh, nhưng xi măng bị ướt. Giá thì hợp lý.",
        "Thất vọng quá, hàng giao chậm 3 ngày, đóng gói cẩu thả.",
        "Tạm được, không có gì đặc biệt.",
        "Shop uy tín, nhân viên tư vấn nhiệt tình. Sẽ ủng hộ tiếp!"
    ]
    
    print("=== Sentiment Analysis Test ===\n")
    for review in test_reviews:
        result = analyzer.analyze(review)
        print(f"Review: {review}")
        print(f"  Sentiment: {result.sentiment} (score: {result.score}, confidence: {result.confidence})")
        print(f"  Keywords: +{result.keywords['positive']} / -{result.keywords['negative']}")
        if result.aspects:
            print(f"  Aspects: {result.aspects}")
        print()
