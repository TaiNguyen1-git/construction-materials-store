#!/usr/bin/env python3
"""
Contractor Matching System
Hybrid recommendation using Content-Based Filtering + Rule-Based Scoring

API Endpoints:
    POST /predict/contractors - Get contractor recommendations for a project
    POST /contractors/retrain - Retrain the TF-IDF model
"""

import re
import math
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

# Try to import scikit-learn for TF-IDF
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False
    print("⚠️ scikit-learn not installed. Using simplified matching.")

# Try to import underthesea for Vietnamese tokenization
try:
    from underthesea import word_tokenize
    HAS_UNDERTHESEA = True
except ImportError:
    HAS_UNDERTHESEA = False


@dataclass
class ContractorMatch:
    """Result of contractor matching"""
    contractor_id: str
    display_name: str
    score: float
    text_similarity: float
    profile_score: float
    location_score: float
    reasons: List[str]


class ContractorMatcher:
    """
    Contractor Matching using Hybrid Recommendation
    
    Formula:
    FINAL_SCORE = (0.50 × Text_Similarity) + (0.35 × Profile_Score) + (0.15 × Location_Score)
    """
    
    # Weights
    WEIGHTS = {
        'text_similarity': 0.50,
        'profile_score': 0.35,
        'location_score': 0.15
    }
    
    # Profile score weights
    PROFILE_WEIGHTS = {
        'rating': 0.40,
        'experience': 0.25,
        'jobs': 0.25,
        'verified': 0.10
    }
    
    # Location score mapping
    LOCATION_SCORES = {
        'same_district': 1.0,
        'same_city': 0.8,
        'same_province': 0.5,
        'other': 0.2
    }
    
    # Vietnamese stopwords (common words to ignore)
    STOPWORDS = {
        'và', 'hoặc', 'để', 'cho', 'của', 'có', 'là', 'với', 'các', 'được',
        'trong', 'này', 'đó', 'khi', 'thì', 'mà', 'như', 'từ', 'về', 'đến',
        'cần', 'phải', 'nên', 'sẽ', 'đã', 'đang', 'rồi', 'vì', 'nếu', 'tại'
    }
    
    def __init__(self):
        self.vectorizer = None
        self.contractor_vectors = None
        self.contractors = []
        self._init_vectorizer()
    
    def _init_vectorizer(self):
        """Initialize TF-IDF vectorizer"""
        if HAS_SKLEARN:
            self.vectorizer = TfidfVectorizer(
                max_features=5000,
                ngram_range=(1, 2),
                min_df=1,
                max_df=0.95
            )
    
    def tokenize(self, text: str) -> str:
        """Tokenize Vietnamese text"""
        if HAS_UNDERTHESEA:
            return word_tokenize(text, format="text")
        else:
            # Basic tokenization
            text = text.lower()
            text = re.sub(r'[^\w\s]', ' ', text)
            return text
    
    def preprocess(self, text: str) -> str:
        """Preprocess text for matching"""
        text = text.lower().strip()
        tokens = self.tokenize(text).split()
        # Remove stopwords
        tokens = [t for t in tokens if t not in self.STOPWORDS]
        return ' '.join(tokens)
    
    def _calculate_text_similarity(
        self, 
        project_text: str, 
        contractor_text: str
    ) -> float:
        """
        Calculate text similarity using TF-IDF + Cosine Similarity
        
        Args:
            project_text: Project description + requirements
            contractor_text: Contractor skills + bio
            
        Returns:
            Similarity score 0.0 to 1.0
        """
        if not HAS_SKLEARN:
            # Fallback: simple word overlap
            return self._simple_text_similarity(project_text, contractor_text)
        
        # Preprocess
        project_processed = self.preprocess(project_text)
        contractor_processed = self.preprocess(contractor_text)
        
        try:
            # Fit on both texts and transform
            tfidf_matrix = self.vectorizer.fit_transform([
                project_processed, 
                contractor_processed
            ])
            
            # Calculate cosine similarity
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(similarity)
            
        except Exception as e:
            print(f"TF-IDF error: {e}")
            return self._simple_text_similarity(project_text, contractor_text)
    
    def _simple_text_similarity(
        self, 
        text1: str, 
        text2: str
    ) -> float:
        """Simple fallback text similarity using word overlap"""
        words1 = set(self.preprocess(text1).split())
        words2 = set(self.preprocess(text2).split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = len(words1 & words2)
        union = len(words1 | words2)
        
        return intersection / union if union > 0 else 0.0
    
    def _calculate_profile_score(self, contractor: Dict) -> float:
        """
        Calculate profile score based on contractor's credentials
        
        Profile_Score = (w1 × Rating_Norm) + (w2 × Experience_Norm) + 
                       (w3 × Jobs_Norm) + (w4 × Verified_Bonus)
        """
        # Normalize rating (0-5 -> 0-1)
        rating = contractor.get('avg_rating', contractor.get('avgRating', 0))
        rating_norm = rating / 5.0
        
        # Normalize experience (max 20 years)
        experience = contractor.get('experience_years', contractor.get('experienceYears', 0))
        experience_norm = min(experience / 20.0, 1.0)
        
        # Normalize completed jobs (max 100)
        jobs = contractor.get('completed_jobs', contractor.get('completedJobs', 0))
        jobs_norm = min(jobs / 100.0, 1.0)
        
        # Verified bonus
        verified = contractor.get('is_verified', contractor.get('isVerified', False))
        verified_bonus = 1.0 if verified else 0.0
        
        # Calculate weighted score
        profile_score = (
            self.PROFILE_WEIGHTS['rating'] * rating_norm +
            self.PROFILE_WEIGHTS['experience'] * experience_norm +
            self.PROFILE_WEIGHTS['jobs'] * jobs_norm +
            self.PROFILE_WEIGHTS['verified'] * verified_bonus
        )
        
        return profile_score
    
    def _calculate_location_score(
        self, 
        contractor: Dict, 
        project: Dict
    ) -> float:
        """
        Calculate location score based on proximity
        
        Same district: 1.0
        Same city: 0.8
        Same province: 0.5
        Other: 0.2
        """
        contractor_city = str(contractor.get('city', '')).lower().strip()
        contractor_district = str(contractor.get('district', '')).lower().strip()
        
        project_city = str(project.get('city', '')).lower().strip()
        project_district = str(project.get('district', '')).lower().strip()
        
        # Check same district
        if contractor_city == project_city and contractor_district == project_district:
            return self.LOCATION_SCORES['same_district']
        
        # Check same city
        if contractor_city == project_city:
            return self.LOCATION_SCORES['same_city']
        
        # Check same province (simplified: check if names contain similar elements)
        if self._same_province(contractor_city, project_city):
            return self.LOCATION_SCORES['same_province']
        
        return self.LOCATION_SCORES['other']
    
    def _same_province(self, city1: str, city2: str) -> bool:
        """Check if two cities are in the same province/region"""
        # Group cities by region
        regions = {
            'dong_nam_bo': ['hồ chí minh', 'tp.hcm', 'biên hòa', 'đồng nai', 'bình dương', 'vũng tàu', 'bà rịa'],
            'ha_noi': ['hà nội', 'thanh hóa', 'nam định', 'ninh bình', 'hải phòng'],
            'mien_tay': ['cần thơ', 'an giang', 'kiên giang', 'cà mau', 'bạc liêu', 'sóc trăng'],
            'mien_trung': ['đà nẵng', 'huế', 'quảng nam', 'quảng ngãi', 'bình định', 'nha trang']
        }
        
        for region, cities in regions.items():
            cities_in_region = [c for c in cities if c in city1.lower() or city1.lower() in c]
            if cities_in_region:
                for c in cities:
                    if c in city2.lower() or city2.lower() in c:
                        return True
        
        return False
    
    def _generate_reasons(
        self, 
        text_sim: float, 
        profile_score: float, 
        location_score: float,
        contractor: Dict
    ) -> List[str]:
        """Generate explanation reasons for the match"""
        reasons = []
        
        if text_sim >= 0.7:
            reasons.append("Kỹ năng phù hợp rất cao với yêu cầu dự án")
        elif text_sim >= 0.5:
            reasons.append("Kỹ năng phù hợp tốt với yêu cầu dự án")
        
        rating = contractor.get('avg_rating', contractor.get('avgRating', 0))
        if rating >= 4.5:
            reasons.append(f"Đánh giá xuất sắc ({rating}/5 sao)")
        elif rating >= 4.0:
            reasons.append(f"Đánh giá tốt ({rating}/5 sao)")
        
        exp = contractor.get('experience_years', contractor.get('experienceYears', 0))
        if exp >= 10:
            reasons.append(f"{exp} năm kinh nghiệm")
        elif exp >= 5:
            reasons.append(f"{exp} năm kinh nghiệm")
        
        if location_score >= 0.8:
            reasons.append("Cùng khu vực địa lý")
        
        if contractor.get('is_verified', contractor.get('isVerified', False)):
            reasons.append("Đã xác minh")
        
        return reasons if reasons else ["Phù hợp với tiêu chí tìm kiếm"]
    
    def match(
        self, 
        project: Dict, 
        contractors: List[Dict],
        limit: int = 10
    ) -> List[ContractorMatch]:
        """
        Find matching contractors for a project
        
        Args:
            project: Project details
                - title: Project title
                - description: Project description
                - requirements: List of requirements
                - city: Project city
                - district: Project district
                
            contractors: List of contractor profiles
            limit: Maximum number of results
            
        Returns:
            List of ContractorMatch sorted by score
        """
        # Prepare project text
        project_text = ' '.join([
            project.get('title', ''),
            project.get('description', ''),
            ' '.join(project.get('requirements', []))
        ])
        
        results = []
        
        for contractor in contractors:
            # Prepare contractor text
            skills = contractor.get('skills', [])
            if isinstance(skills, str):
                skills = [skills]
            
            contractor_text = ' '.join([
                ' '.join(skills),
                contractor.get('bio', ''),
                contractor.get('specialties', '')
            ])
            
            # Calculate scores
            text_sim = self._calculate_text_similarity(project_text, contractor_text)
            profile_score = self._calculate_profile_score(contractor)
            location_score = self._calculate_location_score(contractor, project)
            
            # Calculate final score
            final_score = (
                self.WEIGHTS['text_similarity'] * text_sim +
                self.WEIGHTS['profile_score'] * profile_score +
                self.WEIGHTS['location_score'] * location_score
            )
            
            # Generate reasons
            reasons = self._generate_reasons(text_sim, profile_score, location_score, contractor)
            
            results.append(ContractorMatch(
                contractor_id=contractor.get('id', contractor.get('contractor_id', '')),
                display_name=contractor.get('display_name', contractor.get('displayName', 'Unknown')),
                score=round(final_score, 3),
                text_similarity=round(text_sim, 3),
                profile_score=round(profile_score, 3),
                location_score=round(location_score, 3),
                reasons=reasons
            ))
        
        # Sort by score descending
        results.sort(key=lambda x: x.score, reverse=True)
        
        return results[:limit]


# Flask Blueprint for integration
def create_contractor_blueprint():
    """Create Flask Blueprint for contractor matching"""
    from flask import Blueprint, request, jsonify
    
    bp = Blueprint('contractors', __name__, url_prefix='/contractors')
    matcher = ContractorMatcher()
    
    @bp.route('/match', methods=['POST'])
    def match_contractors():
        """Find matching contractors for a project"""
        data = request.get_json() or {}
        
        project = data.get('project', {})
        contractors = data.get('contractors', [])
        limit = data.get('limit', 10)
        
        if not project:
            return jsonify({
                "success": False,
                "error": "Missing 'project' data"
            }), 400
        
        if not contractors:
            return jsonify({
                "success": False,
                "error": "Missing 'contractors' list"
            }), 400
        
        results = matcher.match(project, contractors, limit)
        
        return jsonify({
            "success": True,
            "data": {
                "projectTitle": project.get('title', ''),
                "totalContractors": len(contractors),
                "matchedCount": len(results),
                "recommendations": [
                    {
                        "contractorId": r.contractor_id,
                        "displayName": r.display_name,
                        "score": r.score,
                        "textSimilarity": r.text_similarity,
                        "profileScore": r.profile_score,
                        "locationScore": r.location_score,
                        "reasons": r.reasons
                    }
                    for r in results
                ]
            }
        })
    
    # Legacy endpoint for compatibility
    @bp.route('/predict', methods=['POST'])
    def predict():
        """Alias for match endpoint"""
        return match_contractors()
    
    return bp


# Alias for app.py compatibility
def create_matching_blueprint():
    return create_contractor_blueprint()


if __name__ == "__main__":
    # Test
    matcher = ContractorMatcher()
    
    test_project = {
        "title": "Xây nhà 2 tầng",
        "description": "Cần thợ hồ có kinh nghiệm xây nhà ở, biết đọc bản vẽ",
        "requirements": ["thợ hồ", "đọc bản vẽ", "xây dựng dân dụng"],
        "city": "Biên Hòa",
        "district": "Tân Phong"
    }
    
    test_contractors = [
        {
            "id": "C001",
            "displayName": "Nguyễn Văn A",
            "skills": ["thợ hồ", "xây dựng", "đọc bản vẽ"],
            "bio": "15 năm kinh nghiệm xây nhà ở dân dụng",
            "city": "Biên Hòa",
            "district": "Tân Phong",
            "avgRating": 4.5,
            "experienceYears": 15,
            "completedJobs": 78,
            "isVerified": True
        },
        {
            "id": "C002",
            "displayName": "Trần Văn B",
            "skills": ["thợ hồ", "xây dựng", "nội thất"],
            "bio": "Chuyên xây dựng công trình thương mại",
            "city": "TP. Hồ Chí Minh",
            "district": "Quận 7",
            "avgRating": 4.8,
            "experienceYears": 12,
            "completedJobs": 95,
            "isVerified": True
        },
        {
            "id": "C003",
            "displayName": "Lê Văn C",
            "skills": ["điện", "nước", "điều hòa"],
            "bio": "Thợ điện nước chuyên nghiệp",
            "city": "Biên Hòa",
            "district": "Long Bình",
            "avgRating": 4.2,
            "experienceYears": 8,
            "completedJobs": 45,
            "isVerified": False
        }
    ]
    
    print("=== Contractor Matching Test ===\n")
    print(f"Project: {test_project['title']}")
    print(f"Requirements: {test_project['requirements']}")
    print(f"Location: {test_project['district']}, {test_project['city']}")
    print()
    
    results = matcher.match(test_project, test_contractors)
    
    for i, result in enumerate(results, 1):
        print(f"{i}. {result.display_name} (Score: {result.score:.0%})")
        print(f"   Text: {result.text_similarity:.0%} | Profile: {result.profile_score:.0%} | Location: {result.location_score:.0%}")
        print(f"   Reasons: {', '.join(result.reasons)}")
        print()
