import os
import shutil
import datetime

# Paths
BRAIN_DIR = r"c:\Users\user\.gemini\antigravity\brain\834b0a94-389b-4de9-bdd9-32706a000c96"
REPO_DOCS_DIR = r"c:\Users\user\.gemini\antigravity\scratch\BuildBidz-Antigravity\docs\agent_history"

def archive():
    timestamp = datetime.datetime.now().strftime("%Y_%m_%d_%H%M%S")
    session_dir = os.path.join(REPO_DOCS_DIR, f"session_{timestamp}")
    
    if not os.path.exists(session_dir):
        os.makedirs(session_dir)
        
    for filename in ["task.md", "implementation_plan.md", "walkthrough.md"]:
        src = os.path.join(BRAIN_DIR, filename)
        if os.path.exists(src):
            dst = os.path.join(session_dir, filename)
            shutil.copy2(src, dst)
            print(f"Archived {filename} to {session_dir}")

if __name__ == "__main__":
    archive()
