from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union, Tuple
import httpx
import os
import json
from datetime import datetime, timedelta

router = APIRouter()

# Models for visualization requests
class CodeStructureRequest(BaseModel):
    repo_name: str
    symbol_name: Optional[str] = None
    symbol_type: Optional[str] = "function"
    visualization_type: str

class KnowledgeTransferRequest(BaseModel):
    repo_name: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    include_ai_authors: Optional[bool] = True

# Models for visualization responses
class Node(BaseModel):
    id: str
    label: str
    color: Optional[str] = None
    size: Optional[int] = None

class Edge(BaseModel):
    from_: str
    to: str
    label: Optional[str] = None

    class Config:
        fields = {
            'from_': 'from',
        }

class VisualizationResponse(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

class KnowledgeTransferTimelineItem(BaseModel):
    date: str
    count: int

class KnowledgeTransferHighImpactSymbol(BaseModel):
    name: str
    filepath: str
    usage_count: int
    last_editor: str

class KnowledgeTransferStats(BaseModel):
    total_commits: int
    ai_commits: int
    ai_percentage: float
    top_ai_files: List[Tuple[str, int]]
    ai_file_count: int
    total_file_count: int

class KnowledgeTransferResponse(BaseModel):
    timeline: List[KnowledgeTransferTimelineItem]
    contributors: List[Tuple[str, int]]
    highImpactSymbols: List[KnowledgeTransferHighImpactSymbol]
    stats: KnowledgeTransferStats

# Mock data for development
def get_mock_visualization_data(visualization_type: str, symbol_name: str = None) -> VisualizationResponse:
    """Generate mock visualization data for development"""
    if visualization_type == "dependency":
        return VisualizationResponse(
            nodes=[
                Node(id="1", label="main.py", color="#9cdcfe"),
                Node(id="2", label="utils.py", color="#a277ff"),
                Node(id="3", label="database.py", color="#ffca85"),
                Node(id="4", label="models.py", color="#f694ff"),
                Node(id="5", label="api.py", color="#a277ff"),
            ],
            edges=[
                Edge(from_="1", to="2"),
                Edge(from_="1", to="3"),
                Edge(from_="2", to="4"),
                Edge(from_="3", to="4"),
                Edge(from_="1", to="5"),
                Edge(from_="5", to="4"),
            ]
        )
    elif visualization_type == "call-trace":
        return VisualizationResponse(
            nodes=[
                Node(id="1", label=f"{symbol_name or 'process_data'}", color="#9cdcfe", size=30),
                Node(id="2", label="validate_input", color="#a277ff", size=20),
                Node(id="3", label="transform_data", color="#a277ff", size=20),
                Node(id="4", label="save_result", color="#a277ff", size=20),
                Node(id="5", label="notify_user", color="#a277ff", size=20),
            ],
            edges=[
                Edge(from_="1", to="2", label="calls"),
                Edge(from_="1", to="3", label="calls"),
                Edge(from_="3", to="4", label="calls"),
                Edge(from_="1", to="5", label="calls"),
            ]
        )
    elif visualization_type == "blast-radius":
        return VisualizationResponse(
            nodes=[
                Node(id="1", label=f"{symbol_name or 'update_user'}", color="#9cdcfe", size=30),
                Node(id="2", label="UserProfile.save", color="#ffca85", size=25),
                Node(id="3", label="validate_email", color="#a277ff", size=20),
                Node(id="4", label="send_notification", color="#a277ff", size=20),
                Node(id="5", label="log_activity", color="#a277ff", size=20),
                Node(id="6", label="update_cache", color="#a277ff", size=20),
            ],
            edges=[
                Edge(from_="1", to="2"),
                Edge(from_="1", to="3"),
                Edge(from_="1", to="4"),
                Edge(from_="2", to="5"),
                Edge(from_="2", to="6"),
            ]
        )
    elif visualization_type == "method-relationships":
        return VisualizationResponse(
            nodes=[
                Node(id="1", label="UserManager", color="#ffca85", size=35),
                Node(id="2", label="UserManager.create_user", color="#9cdcfe", size=25),
                Node(id="3", label="UserManager.update_user", color="#9cdcfe", size=25),
                Node(id="4", label="UserManager.delete_user", color="#9cdcfe", size=25),
                Node(id="5", label="UserManager.get_user", color="#9cdcfe", size=25),
                Node(id="6", label="validate_user_data", color="#a277ff", size=20),
                Node(id="7", label="hash_password", color="#a277ff", size=20),
                Node(id="8", label="send_welcome_email", color="#a277ff", size=20),
            ],
            edges=[
                Edge(from_="1", to="2"),
                Edge(from_="1", to="3"),
                Edge(from_="1", to="4"),
                Edge(from_="1", to="5"),
                Edge(from_="2", to="6"),
                Edge(from_="2", to="7"),
                Edge(from_="2", to="8"),
                Edge(from_="3", to="6"),
                Edge(from_="3", to="7"),
            ]
        )
    else:
        return VisualizationResponse(nodes=[], edges=[])

def get_mock_knowledge_transfer_data() -> KnowledgeTransferResponse:
    """Generate mock knowledge transfer data for development"""
    return KnowledgeTransferResponse(
        timeline=[
            KnowledgeTransferTimelineItem(date="2023-01", count=5),
            KnowledgeTransferTimelineItem(date="2023-02", count=8),
            KnowledgeTransferTimelineItem(date="2023-03", count=12),
            KnowledgeTransferTimelineItem(date="2023-04", count=7),
            KnowledgeTransferTimelineItem(date="2023-05", count=15),
            KnowledgeTransferTimelineItem(date="2023-06", count=10),
        ],
        contributors=[
            ("human-dev1", 45),
            ("ai-assistant", 32),
            ("human-dev2", 28),
            ("human-dev3", 15),
            ("dependabot", 8),
        ],
        highImpactSymbols=[
            KnowledgeTransferHighImpactSymbol(
                name="process_data",
                filepath="src/utils/data_processor.py",
                usage_count=24,
                last_editor="ai-assistant"
            ),
            KnowledgeTransferHighImpactSymbol(
                name="UserManager",
                filepath="src/models/user.py",
                usage_count=18,
                last_editor="human-dev1"
            ),
            KnowledgeTransferHighImpactSymbol(
                name="authenticate_user",
                filepath="src/auth/authentication.py",
                usage_count=15,
                last_editor="ai-assistant"
            ),
            KnowledgeTransferHighImpactSymbol(
                name="generate_report",
                filepath="src/reports/generator.py",
                usage_count=12,
                last_editor="human-dev2"
            ),
            KnowledgeTransferHighImpactSymbol(
                name="ApiClient",
                filepath="src/api/client.py",
                usage_count=10,
                last_editor="ai-assistant"
            ),
        ],
        stats=KnowledgeTransferStats(
            total_commits=128,
            ai_commits=40,
            ai_percentage=31.25,
            top_ai_files=[
                ("src/utils/data_processor.py", 8),
                ("src/auth/authentication.py", 6),
                ("src/api/client.py", 5),
                ("src/models/schema.py", 4),
                ("src/config/settings.py", 3),
            ],
            ai_file_count=24,
            total_file_count=86
        )
    )

@router.post("/dependency", response_model=VisualizationResponse)
async def generate_dependency_visualization(request: CodeStructureRequest):
    """Generate a dependency graph visualization for a repository"""
    try:
        # In a production environment, this would call the codegen visualization service
        # For now, return mock data
        return get_mock_visualization_data("dependency", request.symbol_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating visualization: {str(e)}")

@router.post("/call-trace", response_model=VisualizationResponse)
async def generate_call_trace_visualization(request: CodeStructureRequest):
    """Generate a call trace visualization for a function in a repository"""
    try:
        if not request.symbol_name:
            raise HTTPException(status_code=400, detail="Symbol name is required for call trace visualization")
        
        # In a production environment, this would call the codegen visualization service
        # For now, return mock data
        return get_mock_visualization_data("call-trace", request.symbol_name)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating visualization: {str(e)}")

@router.post("/blast-radius", response_model=VisualizationResponse)
async def generate_blast_radius_visualization(request: CodeStructureRequest):
    """Generate a blast radius visualization for a function in a repository"""
    try:
        if not request.symbol_name:
            raise HTTPException(status_code=400, detail="Symbol name is required for blast radius visualization")
        
        # In a production environment, this would call the codegen visualization service
        # For now, return mock data
        return get_mock_visualization_data("blast-radius", request.symbol_name)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating visualization: {str(e)}")

@router.post("/method-relationships", response_model=VisualizationResponse)
async def generate_method_relationships_visualization(request: CodeStructureRequest):
    """Generate a method relationships visualization for a class in a repository"""
    try:
        if not request.symbol_name:
            raise HTTPException(status_code=400, detail="Symbol name is required for method relationships visualization")
        
        # In a production environment, this would call the codegen visualization service
        # For now, return mock data
        return get_mock_visualization_data("method-relationships", request.symbol_name)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating visualization: {str(e)}")

@router.post("/knowledge-transfer", response_model=KnowledgeTransferResponse)
async def generate_knowledge_transfer_visualization(request: KnowledgeTransferRequest):
    """Generate knowledge transfer visualization data for a repository"""
    try:
        # In a production environment, this would call the codegen AI impact analysis service
        # For now, return mock data
        return get_mock_knowledge_transfer_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating knowledge transfer data: {str(e)}")
