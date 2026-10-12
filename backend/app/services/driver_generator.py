"""
driver_generator.py

Authoritative backend driver code generator for DSA execution.
Synthesizes language-specific drivers (C++, Java, Python, JavaScript)
around user solution code, embedding a cryptographically secure session nonce
in the boundary markers so client code cannot spoof markers or verdicts.
"""

import re
from typing import Dict, Any, List, Tuple, Optional

CPP_HEADERS = """#include <algorithm>
#include <array>
#include <bits/stdc++.h>
#include <cmath>
#include <climits>
#include <functional>
#include <iomanip>
#include <iostream>
#include <limits>
#include <map>
#include <numeric>
#include <queue>
#include <set>
#include <stack>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

using namespace std;"""

CPP_LIST_NODE = """struct ListNode {
    int val;
    ListNode* next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode* next) : val(x), next(next) {}
};"""

CPP_TREE_NODE = """struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;

    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right)
        : val(x), left(left), right(right) {}
};"""

CPP_GRAPH_NODE = """class Node {
public:
    int val;
    vector<Node*> neighbors;
    Node() : val(0), neighbors(vector<Node*>()) {}
    Node(int _val) : val(_val), neighbors(vector<Node*>()) {}
    Node(int _val, vector<Node*> _neighbors) : val(_val), neighbors(_neighbors) {}
};"""

JAVA_LIST_NODE = """class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}"""

JAVA_TREE_NODE = """class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}"""

JAVA_GRAPH_NODE = """class Node {
    public int val;
    public List<Node> neighbors;
    public Node() { val = 0; neighbors = new ArrayList<Node>(); }
    public Node(int _val) { val = _val; neighbors = new ArrayList<Node>(); }
    public Node(int _val, ArrayList<Node> _neighbors) { val = _val; neighbors = _neighbors; }
}"""

PY_LIST_NODE = """class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next"""

PY_TREE_NODE = """class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right"""

PY_GRAPH_NODE = """class Node:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []"""

JS_LIST_NODE = """function ListNode(val, next) {
    this.val = (val === undefined ? 0 : val);
    this.next = (next === undefined ? null : next);
}"""

JS_TREE_NODE = """function TreeNode(val, left, right) {
    this.val = (val === undefined ? 0 : val);
    this.left = (left === undefined ? null : left);
    this.right = (right === undefined ? null : right);
}"""

JS_GRAPH_NODE = """function Node(val, neighbors) {
    this.val = val === undefined ? 0 : val;
    this.neighbors = neighbors === undefined ? [] : neighbors;
}"""


def _strip_curly_block(code: str, pattern: str) -> str:
    """Finds pattern (e.g. struct/class ListNode) and cleanly removes it up to its matching closing brace and optional semicolon."""
    while True:
        match = re.search(pattern, code)
        if not match:
            break
        start_idx = match.start()
        brace_pos = code.find('{', match.start())
        if brace_pos == -1:
            break
        depth = 0
        end_idx = None
        for i in range(brace_pos, len(code)):
            if code[i] == '{':
                depth += 1
            elif code[i] == '}':
                depth -= 1
                if depth == 0:
                    semi = code.find(';', i)
                    if semi != -1 and not code[i+1:semi].strip():
                        end_idx = semi + 1
                    else:
                        end_idx = i + 1
                    break
        if end_idx is not None:
            code = code[:start_idx] + code[end_idx:]
        else:
            break
    return code


def clean_user_code(user_code: str, lang: str) -> str:
    """
    Extracts raw user solution code if the client submitted legacy wrapped code,
    or returns user_code directly.
    """
    code = user_code.replace("\r\n", "\n").strip()
    if not code:
        return ""

    if lang == "python":
        if "def main():" in code and ("__AQ_TC_START_" in code or "__AQ_" in code):
            parts = code.split("def main():")[0]
            parts = re.sub(r"^import\s+[^\n]+\n*", "", parts, flags=re.MULTILINE)
            parts = re.sub(r"^from\s+[^\n]+\n*", "", parts, flags=re.MULTILINE)
            parts = re.sub(r"class ListNode\b.*?(?=\n(?:class|def|\Z))", "", parts, flags=re.DOTALL)
            parts = re.sub(r"class TreeNode\b.*?(?=\n(?:class|def|\Z))", "", parts, flags=re.DOTALL)
            parts = re.sub(r"class Node\b.*?(?=\n(?:class|def|\Z))", "", parts, flags=re.DOTALL)
            return parts.strip()
    elif lang == "cpp":
        if "int main()" in code and ("__AQ_TC_START_" in code or "__AQ_" in code):
            parts = code.split("int main()")[0]
            parts = re.sub(r"#include\s*<[^>]+>\s*", "", parts)
            parts = re.sub(r"using\s+namespace\s+std\s*;\s*", "", parts)
            parts = _strip_curly_block(parts, r"(struct|class)\s+ListNode\b")
            parts = _strip_curly_block(parts, r"(struct|class)\s+TreeNode\b")
            parts = _strip_curly_block(parts, r"(struct|class)\s+Node\b")
            return parts.strip()
    elif lang == "java":
        if "public class Main" in code and ("__AQ_TC_START_" in code or "__AQ_" in code):
            parts = code.split("public class Main")[0]
            parts = re.sub(r"^import\s+[^\n]+;\s*", "", parts, flags=re.MULTILINE)
            parts = _strip_curly_block(parts, r"class\s+ListNode\b")
            parts = _strip_curly_block(parts, r"class\s+TreeNode\b")
            parts = _strip_curly_block(parts, r"class\s+Node\b")
            return parts.strip()
    elif lang == "js":
        if "function main()" in code and ("__AQ_TC_START_" in code or "__AQ_" in code):
            parts = code.split("function main()")[0]
            parts = re.sub(r"^const\s+fs\s*=\s*require\([^\)]+\);\s*", "", parts, flags=re.MULTILINE)
            parts = _strip_curly_block(parts, r"function\s+ListNode\b")
            parts = _strip_curly_block(parts, r"function\s+TreeNode\b")
            parts = _strip_curly_block(parts, r"function\s+Node\b")
            return parts.strip()

    return code


# ── C++ Driver Generation ──────────────────────────────────────────────────────

def _cpp_param(p_type: str, v: str, i: int, ctx: dict) -> str:
    if p_type == "int":
        return f"            int {v}; if(!(cin>>{v}))break;\n"
    if p_type == "bool":
        return f"            int {v}_int; if(!(cin>>{v}_int))break;\n            bool {v}=({v}_int!=0);\n"
    if p_type == "double":
        return f"            double {v}; if(!(cin>>{v}))break;\n"
    if p_type == "string":
        return f'            string {v}; if(!(cin>>{v}))break; if({v}=="@@EMPTY@@"){v}="";\n'
    if p_type == "string:line":
        return f'            string {v}; if(!(cin>>{v}))break; if({v}=="@@EMPTY@@"){{{v}="";}} else {{ for(auto& __c:{v}) if(__c==\'_\') __c=\' \'; }}\n'
    if p_type == "vector<char>":
        return (f"            int n_{i}; if(!(cin>>n_{i}))break;\n"
                f"            vector<char> {v}(n_{i});\n"
                f"            for(int k=0;k<n_{i};++k){{int v_{i};cin>>v_{i};{v}[k]=(char)v_{i};}}\n")
    if p_type == "vector<int>":
        return (f"            int n_{i}; if(!(cin>>n_{i}))break;\n"
                f"            vector<int> {v}(n_{i});\n"
                f"            for(int k=0;k<n_{i};++k)cin>>{v}[k];\n")
    if p_type == "vector<string>":
        return (f"            int n_{i}; if(!(cin>>n_{i}))break;\n"
                f"            vector<string> {v}(n_{i});\n"
                f'            for(int k=0;k<n_{i};++k){{cin>>{v}[k]; if({v}[k]=="@@EMPTY@@"){v}[k]="";}}\n')
    if p_type == "vector<vector<int>>":
        return (f"            int rows_{i},cols_{i}; if(!(cin>>rows_{i}>>cols_{i}))break;\n"
                f"            vector<vector<int>> {v}(rows_{i},vector<int>(cols_{i}));\n"
                f"            for(int r=0;r<rows_{i};++r)for(int c=0;c<cols_{i};++c)cin>>{v}[r][c];\n")
    if p_type == "vector<vector<char>>":
        return (f"            int rows_{i},cols_{i}; if(!(cin>>rows_{i}>>cols_{i}))break;\n"
                f"            vector<vector<char>> {v}(rows_{i},vector<char>(cols_{i}));\n"
                f"            for(int r=0;r<rows_{i};++r)for(int c=0;c<cols_{i};++c){{int v_{i};cin>>v_{i};{v}[r][c]=(char)v_{i};}}\n")
    if p_type == "ListNode*":
        return (f"            int n_{i}; if(!(cin>>n_{i}))break;\n"
                f"            ListNode* {v}=nullptr;\n"
                f"            {{ListNode dummy_{i}(0);ListNode* cur_{i}=&dummy_{i};\n"
                f"            for(int k=0;k<n_{i};++k){{int val;cin>>val;cur_{i}->next=new ListNode(val);cur_{i}=cur_{i}->next;}}\n"
                f"            {v}=dummy_{i}.next;}}\n")
    if p_type == "ListNode*:intersectA":
        ctx["intersectB"] = f"__intersectB_{i}"
        return (f"            int na_{i}; if(!(cin>>na_{i}))break;\n"
                f"            vector<int> arrA_{i}(na_{i}); for(int k=0;k<na_{i};++k)cin>>arrA_{i}[k];\n"
                f"            int nb_{i}; cin>>nb_{i};\n"
                f"            vector<int> arrB_{i}(nb_{i}); for(int k=0;k<nb_{i};++k)cin>>arrB_{i}[k];\n"
                f"            int nc_{i}; cin>>nc_{i};\n"
                f"            vector<int> arrC_{i}(nc_{i}); for(int k=0;k<nc_{i};++k)cin>>arrC_{i}[k];\n"
                f"            ListNode* tailHead_{i}=nullptr;\n"
                f"            {{ListNode dC_{i}(0); ListNode* cC_{i}=&dC_{i};\n"
                f"            for(int k=0;k<nc_{i};++k){{cC_{i}->next=new ListNode(arrC_{i}[k]);cC_{i}=cC_{i}->next;}}\n"
                f"            tailHead_{i}=dC_{i}.next;}}\n"
                f"            ListNode* {v}=nullptr;\n"
                f"            {{ListNode dA_{i}(0); ListNode* cA_{i}=&dA_{i};\n"
                f"            for(int k=0;k<na_{i};++k){{cA_{i}->next=new ListNode(arrA_{i}[k]);cA_{i}=cA_{i}->next;}}\n"
                f"            cA_{i}->next=tailHead_{i};\n"
                f"            {v}=dA_{i}.next;}}\n"
                f"            ListNode* __intersectB_{i}=nullptr;\n"
                f"            {{ListNode dB_{i}(0); ListNode* cB_{i}=&dB_{i};\n"
                f"            for(int k=0;k<nb_{i};++k){{cB_{i}->next=new ListNode(arrB_{i}[k]);cB_{i}=cB_{i}->next;}}\n"
                f"            cB_{i}->next=tailHead_{i};\n"
                f"            __intersectB_{i}=dB_{i}.next;}}\n")
    if p_type == "ListNode*:intersectB":
        return f"            ListNode* {v}={ctx.get('intersectB', 'nullptr')};\n"
    if p_type == "vector<ListNode*>":
        return (f"            int num_lists_{i}; if(!(cin>>num_lists_{i}))break;\n"
                f"            vector<ListNode*> {v}(num_lists_{i});\n"
                f"            for(int L=0; L<num_lists_{i}; ++L) {{\n"
                f"                int n_L; cin>>n_L;\n"
                f"                ListNode dummy(0); ListNode* cur = &dummy;\n"
                f"                for(int k=0; k<n_L; ++k) {{ int val; cin>>val; cur->next = new ListNode(val); cur = cur->next; }}\n"
                f"                {v}[L] = dummy.next;\n"
                f"            }}\n")
    if p_type == "ListNode*:cycle":
        return (f"            int n_{i}; if(!(cin>>n_{i}))break;\n"
                f"            ListNode* {v}=nullptr; int pos_{i}=-1;\n"
                f"            {{vector<int> arr_{i}(n_{i});\n"
                f"            for(int k=0;k<n_{i};++k)cin>>arr_{i}[k];\n"
                f"            cin>>pos_{i};\n"
                f"            if(n_{i}>0){{vector<ListNode*> nodes_{i};\n"
                f"            for(int k=0;k<n_{i};++k)nodes_{i}.push_back(new ListNode(arr_{i}[k]));\n"
                f"            for(int k=0;k<n_{i}-1;++k)nodes_{i}[k]->next=nodes_{i}[k+1];\n"
                f"            if(pos_{i}>=0&&pos_{i}<n_{i})nodes_{i}[n_{i}-1]->next=nodes_{i}[pos_{i}];\n"
                f"            {v}=nodes_{i}[0];}}}}\n")
    if p_type == "TreeNode*":
        ctx["treeRootVar"] = v
        return (f"            int n_{i}; if(!(cin>>n_{i}))break;\n"
                f"            TreeNode* {v}=nullptr;\n"
                f"            {{vector<int> arr_{i}(n_{i});\n"
                f"            for(int k=0;k<n_{i};++k)cin>>arr_{i}[k];\n"
                f"            if(n_{i}>0&&arr_{i}[0]!=-1){{\n"
                f"              {v}=new TreeNode(arr_{i}[0]);\n"
                f"              queue<TreeNode*> bq_{i};bq_{i}.push({v});int idx_{i}=1;\n"
                f"              while(!bq_{i}.empty()&&idx_{i}<n_{i}){{\n"
                f"                TreeNode* nd=bq_{i}.front();bq_{i}.pop();\n"
                f"                if(idx_{i}<n_{i}&&arr_{i}[idx_{i}]!=-1){{nd->left=new TreeNode(arr_{i}[idx_{i}]);bq_{i}.push(nd->left);}}idx_{i}++;\n"
                f"                if(idx_{i}<n_{i}&&arr_{i}[idx_{i}]!=-1){{nd->right=new TreeNode(arr_{i}[idx_{i}]);bq_{i}.push(nd->right);}}idx_{i}++;\n"
                f"              }}\n"
                f"            }}}}\n")
    if p_type == "TreeNode*->val":
        root = ctx.get("treeRootVar", "nullptr")
        return (f"            int {v}_val; if(!(cin>>{v}_val))break;\n"
                f"            TreeNode* {v}=nullptr;\n"
                f"            {{queue<TreeNode*> fq;if({root})fq.push({root});\n"
                f"            while(!fq.empty()){{TreeNode* fn=fq.front();fq.pop();\n"
                f"            if(fn->val=={v}_val){{{v}=fn;break;}}\n"
                f"            if(fn->left)fq.push(fn->left);if(fn->right)fq.push(fn->right);}}}}\n")
    if p_type == "Node*":
        ctx["needsNodeStruct"] = True
        return (f"            int n_{i}; if(!(cin>>n_{i}))break;\n"
                f"            Node* {v}=nullptr;\n"
                f"            {{if(n_{i}>0){{\n"
                f"              vector<Node*> nodes_{i};\n"
                f"              for(int k=0;k<n_{i};++k)nodes_{i}.push_back(new Node(k+1));\n"
                f"              for(int k=0;k<n_{i};++k){{int deg;cin>>deg;\n"
                f"                for(int j=0;j<deg;++j){{int nb;cin>>nb;nodes_{i}[k]->neighbors.push_back(nodes_{i}[nb-1]);}}}}\n"
                f"              {v}=nodes_{i}[0];}}}}\n")
    return f"            // [unsupported param type: {p_type}]\n"


def _cpp_return(ret_type: str, call: str, params: list) -> str:
    if ret_type == "void":
        fp = params[0] if params else {}
        fa = "param_0"
        print_code = "            cout<<1<<endl;\n"
        pt = fp.get("type", "")
        if pt == "vector<int>":
            print_code = (f"            for(int i=0;i<(int){fa}.size();++i)cout<<{fa}[i]<<(i==(int){fa}.size()-1?\"\":\" \");\n"
                          f"            cout<<endl;\n")
        elif pt in ("vector<vector<int>>", "vector<vector<char>>"):
            print_code = (f"            for(int r=0;r<(int){fa}.size();++r){{for(int c=0;c<(int){fa}[r].size();++c)cout<<(int){fa}[r][c]<<(c==(int){fa}[r].size()-1?\"\":\" \");cout<<endl;}}\n")
        elif pt == "vector<char>":
            print_code = (f"            for(int i=0;i<(int){fa}.size();++i)cout<<(int){fa}[i]<<(i==(int){fa}.size()-1?\"\":\" \");\n"
                          f"            cout<<endl;\n")
        return f"            {call};\n" + print_code
    if ret_type == "void:board":
        return f"            {call};\n            cout<<1<<endl;\n"
    if ret_type == "bool":
        return f"            bool res={call};\n            cout<<(res?\"1\":\"0\")<<endl;\n"
    if ret_type == "int":
        return f"            int res={call};\n            cout<<res<<endl;\n"
    if ret_type == "double":
        return f"            double res={call};\n            cout<<fixed<<setprecision(5)<<res<<endl;\n"
    if ret_type == "string":
        return f"            string res={call};\n            cout<<res<<endl;\n"
    if ret_type == "vector<int>":
        return f"            vector<int> res={call};\n            for(int i=0;i<(int)res.size();++i)cout<<res[i]<<(i==(int)res.size()-1?\"\":\" \");\n            cout<<endl;\n"
    if ret_type == "vector<string>":
        return f"            vector<string> res={call};\n            for(int i=0;i<(int)res.size();++i)cout<<res[i]<<endl;\n"
    if ret_type == "vector<vector<int>>":
        return f"            vector<vector<int>> res={call};\n            for(int i=0;i<(int)res.size();++i){{for(int j=0;j<(int)res[i].size();++j)cout<<res[i][j]<<(j==(int)res[i].size()-1?\"\":\" \");cout<<endl;}}\n"
    if ret_type == "count:vector<int>":
        return f"            vector<int> res={call};\n            cout<<(int)res.size()<<endl;\n"
    if ret_type == "count:vector<vector<int>>":
        return f"            vector<vector<int>> res={call};\n            cout<<(int)res.size()<<endl;\n"
    if ret_type == "count:vector<string>":
        return f"            vector<string> res={call};\n            cout<<(int)res.size()<<endl;\n"
    if ret_type == "count:vector<vector<string>>":
        return f"            vector<vector<string>> res={call};\n            cout<<(int)res.size()<<endl;\n"
    if ret_type == "ListNode*":
        return f"            ListNode* res={call};\n            {{bool first=true;ListNode* cur=res;while(cur){{if(!first)cout<<\" \";cout<<cur->val;cur=cur->next;first=false;}}cout<<endl;}}\n"
    if ret_type == "ListNode*->val":
        return f"            ListNode* res={call};\n            cout<<(res?res->val:-1)<<endl;\n"
    if ret_type in ("TreeNode*", "TreeNode*:raw"):
        return f"            TreeNode* res={call};\n            {{if(!res){{cout<<endl;}}else{{queue<TreeNode*> bq;bq.push(res);bool first=true;while(!bq.empty()){{TreeNode* nd=bq.front();bq.pop();if(!first)cout<<\" \";cout<<nd->val;first=false;if(nd->left)bq.push(nd->left);if(nd->right)bq.push(nd->right);}}cout<<endl;}}}}\n"
    if ret_type == "TreeNode*->val":
        return f"            TreeNode* res={call};\n            cout<<(res?res->val:-1)<<endl;\n"
    if ret_type == "count:TreeNode*":
        return f"            TreeNode* res={call};\n            {{int cnt=0;queue<TreeNode*> cq;if(res)cq.push(res);while(!cq.empty()){{TreeNode* nd=cq.front();cq.pop();cnt++;if(nd->left)cq.push(nd->left);if(nd->right)cq.push(nd->right);}}cout<<cnt<<endl;}}\n"
    if ret_type == "int:cloneGraph":
        return (f"            Node* cloned={call};\n"
                f"            {{if(!cloned){{cout<<0<<endl;}}else{{\n"
                f"              unordered_set<Node*> visited;\n"
                f"              queue<Node*> bq;bq.push(cloned);\n"
                f"              while(!bq.empty()){{Node* nd=bq.front();bq.pop();\n"
                f"              if(visited.count(nd))continue;visited.insert(nd);\n"
                f"              for(Node* nb:nd->neighbors)bq.push(nb);}}\n"
                f"              cout<<(int)visited.size()<<endl;}}}}\n")
    if ret_type == "design:MinStack":
        return "            for(int x : param_0) solver.push(x);\n            cout << solver.getMin() << endl;\n"
    if ret_type == "design:MyQueue":
        return "            for(int x : param_0) solver.push(x);\n            cout << solver.peek() << endl;\n"
    if ret_type == "design:MyCircularQueue":
        return "            for(int x : param_0) solver.enQueue(x);\n            cout << solver.Rear() << endl;\n"
    if ret_type == "design:MedianFinder":
        return "            for(int x : param_0) solver.addNum(x);\n            cout << fixed << setprecision(1) << solver.findMedian() << endl;\n"
    if ret_type == "design:Codec":
        return "            string enc = solver.encode(param_0);\n            vector<string> dec = solver.decode(enc);\n            cout << dec.size() << endl;\n"
    if ret_type == "design:CodecTree":
        return "            string enc = solver.serialize(param_0);\n            TreeNode* dec = solver.deserialize(enc);\n            int cnt=0;queue<TreeNode*> cq;if(dec)cq.push(dec);while(!cq.empty()){TreeNode* nd=cq.front();cq.pop();cnt++;if(nd->left)cq.push(nd->left);if(nd->right)cq.push(nd->right);}cout<<cnt<<endl;\n"
    return f"            // [unsupported returnType: {ret_type}]\n"


# ── Java Driver Generation ─────────────────────────────────────────────────────

def _java_param(p_type: str, v: str, i: int, ctx: dict) -> str:
    if p_type == "int":
        return f"            if(!sc.hasNextInt())break;\n            int {v}=sc.nextInt();\n"
    if p_type == "bool":
        return f"            if(!sc.hasNextInt())break;\n            boolean {v}=(sc.nextInt()!=0);\n"
    if p_type == "double":
        return f"            if(!sc.hasNextDouble())break;\n            double {v}=sc.nextDouble();\n"
    if p_type == "string":
        return f'            if(!sc.hasNext())break;\n            String {v}=sc.next(); if({v}.equals("@@EMPTY@@")){v}="";\n'
    if p_type == "string:line":
        return f'            if(!sc.hasNext())break;\n            String {v}=sc.next(); if({v}.equals("@@EMPTY@@")){{{v}="";}} else {{ {v}={v}.replace(\'_\',\' \'); }}\n'
    if p_type == "vector<char>":
        return (f"            if(!sc.hasNextInt())break;\n"
                f"            int n_{i}=sc.nextInt();\n"
                f"            char[] {v}=new char[n_{i}];\n"
                f"            for(int k=0;k<n_{i};k++){v}[k]=(char)sc.nextInt();\n")
    if p_type == "vector<int>":
        return (f"            if(!sc.hasNextInt())break;\n"
                f"            int n_{i}=sc.nextInt();\n"
                f"            int[] {v}=new int[n_{i}];\n"
                f"            for(int k=0;k<n_{i};k++){v}[k]=sc.nextInt();\n")
    if p_type == "vector<string>":
        return (f"            if(!sc.hasNextInt())break;\n"
                f"            int n_{i}=sc.nextInt();\n"
                f"            String[] {v}=new String[n_{i}];\n"
                f'            for(int k=0;k<n_{i};k++){{{v}[k]=sc.next(); if({v}[k].equals("@@EMPTY@@")){v}[k]="";}}\n')
    if p_type == "vector<vector<int>>":
        return (f"            if(!sc.hasNextInt())break;\n"
                f"            int rows_{i}=sc.nextInt(),cols_{i}=sc.nextInt();\n"
                f"            int[][] {v}=new int[rows_{i}][cols_{i}];\n"
                f"            for(int r=0;r<rows_{i};r++)for(int c=0;c<cols_{i};c++){v}[r][c]=sc.nextInt();\n")
    if p_type == "vector<vector<char>>":
        return (f"            if(!sc.hasNextInt())break;\n"
                f"            int rows_{i}=sc.nextInt(),cols_{i}=sc.nextInt();\n"
                f"            char[][] {v}=new char[rows_{i}][cols_{i}];\n"
                f"            for(int r=0;r<rows_{i};r++)for(int c=0;c<cols_{i};c++){v}[r][c]=(char)sc.nextInt();\n")
    if p_type == "ListNode*":
        return (f"            if(!sc.hasNextInt())break;\n"
                f"            int n_{i}=sc.nextInt();\n"
                f"            ListNode {v}=null;\n"
                f"            {{\n"
                f"                ListNode dummy=new ListNode(0); ListNode cur=dummy;\n"
                f"                for(int k=0;k<n_{i};k++){{ cur.next=new ListNode(sc.nextInt()); cur=cur.next; }}\n"
                f"                {v}=dummy.next;\n"
                f"            }}\n")
    if p_type == "ListNode*:intersectA":
        ctx["intersectB"] = f"__intersectB_{i}"
        return (f"            if(!sc.hasNextInt())break;\n"
                f"            int na_{i}=sc.nextInt(); int[] arrA_{i}=new int[na_{i}]; for(int k=0;k<na_{i};k++)arrA_{i}[k]=sc.nextInt();\n"
                f"            int nb_{i}=sc.nextInt(); int[] arrB_{i}=new int[nb_{i}]; for(int k=0;k<nb_{i};k++)arrB_{i}[k]=sc.nextInt();\n"
                f"            int nc_{i}=sc.nextInt(); int[] arrC_{i}=new int[nc_{i}]; for(int k=0;k<nc_{i};k++)arrC_{i}[k]=sc.nextInt();\n"
                f"            ListNode tailHead_{i}=null;\n"
                f"            {{ ListNode dC=new ListNode(0); ListNode cC=dC; for(int k=0;k<nc_{i};k++){{ cC.next=new ListNode(arrC_{i}[k]); cC=cC.next; }} tailHead_{i}=dC.next; }}\n"
                f"            ListNode {v}=null;\n"
                f"            {{ ListNode dA=new ListNode(0); ListNode cA=dA; for(int k=0;k<na_{i};k++){{ cA.next=new ListNode(arrA_{i}[k]); cA=cA.next; }} cA.next=tailHead_{i}; {v}=dA.next; }}\n"
                f"            ListNode __intersectB_{i}=null;\n"
                f"            {{ ListNode dB=new ListNode(0); ListNode cB=dB; for(int k=0;k<nb_{i};k++){{ cB.next=new ListNode(arrB_{i}[k]); cB=cB.next; }} cB.next=tailHead_{i}; __intersectB_{i}=dB.next; }}\n")
    if p_type == "ListNode*:intersectB":
        return f"            ListNode {v}={ctx.get('intersectB', 'null')};\n"
    if p_type == "vector<ListNode*>":
        return (f"            if(!sc.hasNextInt())break;\n"
                f"            int num_lists_{i}=sc.nextInt();\n"
                f"            ListNode[] {v}=new ListNode[num_lists_{i}];\n"
                f"            for(int L=0; L<num_lists_{i}; L++) {{\n"
                f"                int n_L = sc.nextInt();\n"
                f"                ListNode dummy = new ListNode(0); ListNode cur = dummy;\n"
                f"                for(int k=0; k<n_L; k++) {{ cur.next = new ListNode(sc.nextInt()); cur = cur.next; }}\n"
                f"                {v}[L] = dummy.next;\n"
                f"            }}\n")
    if p_type == "ListNode*:cycle":
        return (f"            if(!sc.hasNextInt())break;\n"
                f"            int n_{i}=sc.nextInt();\n"
                f"            int[] arr_{i}=new int[n_{i}]; for(int k=0;k<n_{i};k++)arr_{i}[k]=sc.nextInt();\n"
                f"            int pos_{i}=sc.nextInt();\n"
                f"            ListNode {v}=null;\n"
                f"            if(n_{i}>0){{\n"
                f"                ListNode[] nodes_{i}=new ListNode[n_{i}];\n"
                f"                for(int k=0;k<n_{i};k++)nodes_{i}[k]=new ListNode(arr_{i}[k]);\n"
                f"                for(int k=0;k<n_{i}-1;k++)nodes_{i}[k].next=nodes_{i}[k+1];\n"
                f"                if(pos_{i}>=0&&pos_{i}<n_{i})nodes_{i}[n_{i}-1].next=nodes_{i}[pos_{i}];\n"
                f"                {v}=nodes_{i}[0];\n"
                f"            }}\n")
    if p_type == "TreeNode*":
        ctx["treeRootVar"] = v
        return (f"            if(!sc.hasNextInt())break;\n"
                f"            int n_{i}=sc.nextInt();\n"
                f"            int[] arr_{i}=new int[n_{i}]; for(int k=0;k<n_{i};k++)arr_{i}[k]=sc.nextInt();\n"
                f"            TreeNode {v}=null;\n"
                f"            if(n_{i}>0&&arr_{i}[0]!=-1){{\n"
                f"                {v}=new TreeNode(arr_{i}[0]);\n"
                f"                java.util.Queue<TreeNode> bq_{i}=new java.util.LinkedList<>(); bq_{i}.add({v});\n"
                f"                int idx_{i}=1;\n"
                f"                while(!bq_{i}.isEmpty()&&idx_{i}<n_{i}){{\n"
                f"                    TreeNode nd=bq_{i}.poll();\n"
                f"                    if(idx_{i}<n_{i}&&arr_{i}[idx_{i}]!=-1){{ nd.left=new TreeNode(arr_{i}[idx_{i}]); bq_{i}.add(nd.left); }} idx_{i}++;\n"
                f"                    if(idx_{i}<n_{i}&&arr_{i}[idx_{i}]!=-1){{ nd.right=new TreeNode(arr_{i}[idx_{i}]); bq_{i}.add(nd.right); }} idx_{i}++;\n"
                f"                }}\n"
                f"            }}\n")
    if p_type == "TreeNode*->val":
        root = ctx.get("treeRootVar", "null")
        return (f"            if(!sc.hasNextInt())break;\n"
                f"            int {v}_val=sc.nextInt();\n"
                f"            TreeNode {v}=null;\n"
                f"            if({root}!=null){{\n"
                f"                java.util.Queue<TreeNode> fq=new java.util.LinkedList<>(); fq.add({root});\n"
                f"                while(!fq.isEmpty()){{\n"
                f"                    TreeNode fn=fq.poll();\n"
                f"                    if(fn.val=={v}_val){{ {v}=fn; break; }}\n"
                f"                    if(fn.left!=null)fq.add(fn.left); if(fn.right!=null)fq.add(fn.right);\n"
                f"                }}\n"
                f"            }}\n")
    if p_type == "Node*":
        return (f"            if(!sc.hasNextInt())break;\n"
                f"            int n_{i}=sc.nextInt();\n"
                f"            Node {v}=null;\n"
                f"            if(n_{i}>0){{\n"
                f"                Node[] nodes_{i}=new Node[n_{i}];\n"
                f"                for(int k=0;k<n_{i};k++)nodes_{i}[k]=new Node(k+1);\n"
                f"                for(int k=0;k<n_{i};k++){{\n"
                f"                    int deg=sc.nextInt();\n"
                f"                    for(int j=0;j<deg;j++){{ int nb=sc.nextInt(); nodes_{i}[k].neighbors.add(nodes_{i}[nb-1]); }}\n"
                f"                }}\n"
                f"                {v}=nodes_{i}[0];\n"
                f"            }}\n")
    return f"            // [unsupported param type: {p_type}]\n"


def _java_return(ret_type: str, call: str, params: list) -> str:
    if ret_type == "void":
        fp = params[0] if params else {}
        fa = "param_0"
        print_code = "            System.out.println(1);\n"
        if fp.get("type") == "vector<int>":
            print_code = f"            for(int i=0;i<{fa}.length;i++)System.out.print({fa}[i]+(i=={fa}.length-1?\"\":\" \"));\n            System.out.println();\n"
        return f"            {call};\n" + print_code
    if ret_type == "void:board":
        return f"            {call};\n            System.out.println(1);\n"
    if ret_type == "bool":
        return f"            boolean res={call};\n            System.out.println(res?\"1\":\"0\");\n"
    if ret_type == "int":
        return f"            int res={call};\n            System.out.println(res);\n"
    if ret_type == "double":
        return f'            double res={call};\n            System.out.printf(java.util.Locale.US, "%.5f%n", res);\n'
    if ret_type == "string":
        return f"            String res={call};\n            System.out.println(res);\n"
    if ret_type == "vector<int>":
        return f'            int[] res={call};\n            for(int i=0;i<res.length;i++)System.out.print(res[i]+(i==res.length-1?"":" "));\n            System.out.println();\n'
    if ret_type == "vector<string>":
        return (f"            Object resObj={call};\n"
                f"            if(resObj instanceof String[]){{\n"
                f"                for(String s:(String[])resObj)System.out.println(s);\n"
                f"            }}else if(resObj instanceof java.util.List){{\n"
                f"                for(Object s:(java.util.List<?>)resObj)System.out.println(s);\n"
                f"            }}\n")
    if ret_type == "vector<vector<int>>":
        return (f"            Object resObj={call};\n"
                f"            if(resObj instanceof int[][]) {{\n"
                f"                int[][] resArr=(int[][])resObj;\n"
                f"                for(int i=0;i<resArr.length;i++){{\n"
                f"                    for(int j=0;j<resArr[i].length;j++)System.out.print(resArr[i][j]+(j==resArr[i].length-1?\"\":\" \"));\n"
                f"                    System.out.println();\n"
                f"                }}\n"
                f"            }} else if(resObj instanceof java.util.List) {{\n"
                f"                java.util.List<?> resList=(java.util.List<?>)resObj;\n"
                f"                for(int i=0;i<resList.size();i++){{\n"
                f"                    java.util.List<?> row=(java.util.List<?>)resList.get(i);\n"
                f"                    for(int j=0;j<row.size();j++)System.out.print(row.get(j)+(j==row.size()-1?\"\":\" \"));\n"
                f"                    System.out.println();\n"
                f"                }}\n"
                f"            }}\n")
    if ret_type in ("count:vector<vector<int>>", "count:vector<vector<string>>", "count:vector<string>", "count:vector<int>"):
        return f"            java.util.List<?> res={call};\n            System.out.println(res.size());\n"
    if ret_type == "ListNode*":
        return (f"            ListNode res={call};\n"
                f"            boolean first=true; ListNode cur=res;\n"
                f"            while(cur!=null){{\n"
                f"                if(!first)System.out.print(\" \");\n"
                f"                System.out.print(cur.val);\n"
                f"                cur=cur.next; first=false;\n"
                f"            }}\n"
                f"            System.out.println();\n")
    if ret_type == "ListNode*->val":
        return f"            ListNode res={call};\n            System.out.println(res!=null?res.val:-1);\n"
    if ret_type in ("TreeNode*", "TreeNode*:raw"):
        return (f"            TreeNode res={call};\n"
                f"            if(res==null){{ System.out.println(); }}else{{\n"
                f"                java.util.Queue<TreeNode> bq=new java.util.LinkedList<>(); bq.add(res);\n"
                f"                boolean first=true;\n"
                f"                while(!bq.isEmpty()){{\n"
                f"                    TreeNode nd=bq.poll();\n"
                f"                    if(!first)System.out.print(\" \");\n"
                f"                    System.out.print(nd.val); first=false;\n"
                f"                    if(nd.left!=null)bq.add(nd.left);\n"
                f"                    if(nd.right!=null)bq.add(nd.right);\n"
                f"                }}\n"
                f"                System.out.println();\n"
                f"            }}\n")
    if ret_type == "TreeNode*->val":
        return f"            TreeNode res={call};\n            System.out.println(res!=null?res.val:-1);\n"
    if ret_type == "count:TreeNode*":
        return (f"            TreeNode res={call};\n"
                f"            int cnt=0; java.util.Queue<TreeNode> cq=new java.util.LinkedList<>();\n"
                f"            if(res!=null)cq.add(res);\n"
                f"            while(!cq.isEmpty()){{\n"
                f"                TreeNode nd=cq.poll(); cnt++;\n"
                f"                if(nd.left!=null)cq.add(nd.left); if(nd.right!=null)cq.add(nd.right);\n"
                f"            }}\n"
                f"            System.out.println(cnt);\n")
    if ret_type == "int:cloneGraph":
        return (f"            Node cloned={call};\n"
                f"            if(cloned==null){{ System.out.println(0); }}else{{\n"
                f"                java.util.Set<Node> visited=new java.util.HashSet<>();\n"
                f"                java.util.Queue<Node> bq=new java.util.LinkedList<>(); bq.add(cloned);\n"
                f"                while(!bq.isEmpty()){{\n"
                f"                    Node nd=bq.poll();\n"
                f"                    if(visited.contains(nd))continue; visited.add(nd);\n"
                f"                    for(Node nb:nd.neighbors)bq.add(nb);\n"
                f"                }}\n"
                f"                System.out.println(visited.size());\n"
                f"            }}\n")
    if ret_type == "design:MinStack":
        return "            for(int x : param_0) solver.push(x);\n            System.out.println(solver.getMin());\n"
    if ret_type == "design:MyQueue":
        return "            for(int x : param_0) solver.push(x);\n            System.out.println(solver.peek());\n"
    if ret_type == "design:MyCircularQueue":
        return "            for(int x : param_0) solver.enQueue(x);\n            System.out.println(solver.Rear());\n"
    if ret_type == "design:MedianFinder":
        return '            for(int x : param_0) solver.addNum(x);\n            System.out.printf(java.util.Locale.US, "%.1f%n", solver.findMedian());\n'
    if ret_type == "design:Codec":
        return "            String enc = solver.encode(java.util.Arrays.asList(param_0));\n            java.util.List<String> dec = solver.decode(enc);\n            System.out.println(dec.size());\n"
    if ret_type == "design:CodecTree":
        return "            String enc = solver.serialize(param_0);\n            TreeNode dec = solver.deserialize(enc);\n            int cnt=0; java.util.Queue<TreeNode> cq = new java.util.LinkedList<>(); if(dec!=null)cq.add(dec); while(!cq.isEmpty()){TreeNode nd=cq.poll(); cnt++; if(nd.left!=null)cq.add(nd.left); if(nd.right!=null)cq.add(nd.right);} System.out.println(cnt);\n"
    return f"            // [unsupported returnType: {ret_type}]\n"


# ── Python Driver Generation ───────────────────────────────────────────────────

def _py_param(p_type: str, v: str, i: int, ctx: dict) -> str:
    if p_type == "int":
        return f"            {v}=int(next(iterator))\n"
    if p_type == "bool":
        return f"            {v}=(int(next(iterator))!=0)\n"
    if p_type == "double":
        return f"            {v}=float(next(iterator))\n"
    if p_type == "string":
        return f'            {v}=next(iterator); {v}="" if {v}=="@@EMPTY@@" else {v}\n'
    if p_type == "string:line":
        return f'            {v}=next(iterator); {v}="" if {v}=="@@EMPTY@@" else {v}.replace(\'_\',\' \')\n'
    if p_type == "vector<char>":
        return (f"            n_{i}=int(next(iterator))\n"
                f"            {v}=[chr(int(next(iterator))) for _ in range(n_{i})]\n")
    if p_type == "vector<int>":
        return (f"            n_{i}=int(next(iterator))\n"
                f"            {v}=[int(next(iterator)) for _ in range(n_{i})]\n")
    if p_type == "vector<string>":
        return (f"            n_{i}=int(next(iterator))\n"
                f'            {v}=[(lambda s: "" if s=="@@EMPTY@@" else s)(next(iterator)) for _ in range(n_{i})]\n')
    if p_type == "vector<vector<int>>":
        return (f"            rows_{i}=int(next(iterator));cols_{i}=int(next(iterator))\n"
                f"            {v}=[[int(next(iterator)) for _ in range(cols_{i})] for _ in range(rows_{i})]\n")
    if p_type == "vector<vector<char>>":
        return (f"            rows_{i}=int(next(iterator));cols_{i}=int(next(iterator))\n"
                f"            {v}=[[chr(int(next(iterator))) for _ in range(cols_{i})] for _ in range(rows_{i})]\n")
    if p_type == "ListNode*":
        return (f"            n_{i}=int(next(iterator))\n"
                f"            dummy_{i}=ListNode(0); cur_{i}=dummy_{i}\n"
                f"            for _ in range(n_{i}):\n"
                f"                cur_{i}.next=ListNode(int(next(iterator)))\n"
                f"                cur_{i}=cur_{i}.next\n"
                f"            {v}=dummy_{i}.next\n")
    if p_type == "ListNode*:intersectA":
        ctx["intersectB"] = f"__intersectB_{i}"
        return (f"            na_{i}=int(next(iterator))\n"
                f"            arrA_{i}=[int(next(iterator)) for _ in range(na_{i})]\n"
                f"            nb_{i}=int(next(iterator))\n"
                f"            arrB_{i}=[int(next(iterator)) for _ in range(nb_{i})]\n"
                f"            nc_{i}=int(next(iterator))\n"
                f"            arrC_{i}=[int(next(iterator)) for _ in range(nc_{i})]\n"
                f"            dC=ListNode(0); cC=dC\n"
                f"            for x in arrC_{i}: cC.next=ListNode(x); cC=cC.next\n"
                f"            tailHead_{i}=dC.next\n"
                f"            dA=ListNode(0); cA=dA\n"
                f"            for x in arrA_{i}: cA.next=ListNode(x); cA=cA.next\n"
                f"            cA.next=tailHead_{i}; {v}=dA.next\n"
                f"            dB=ListNode(0); cB=dB\n"
                f"            for x in arrB_{i}: cB.next=ListNode(x); cB=cB.next\n"
                f"            cB.next=tailHead_{i}; __intersectB_{i}=dB.next\n")
    if p_type == "ListNode*:intersectB":
        return f"            {v}={ctx.get('intersectB', 'None')}\n"
    if p_type == "vector<ListNode*>":
        return (f"            num_lists_{i}=int(next(iterator))\n"
                f"            {v}=[]\n"
                f"            for _ in range(num_lists_{i}):\n"
                f"                n_L = int(next(iterator))\n"
                f"                dummy = ListNode(0); cur = dummy\n"
                f"                for _ in range(n_L): cur.next = ListNode(int(next(iterator))); cur = cur.next\n"
                f"                {v}.append(dummy.next)\n")
    if p_type == "ListNode*:cycle":
        return (f"            n_{i}=int(next(iterator))\n"
                f"            arr_{i}=[int(next(iterator)) for _ in range(n_{i})]\n"
                f"            pos_{i}=int(next(iterator))\n"
                f"            nodes_{i}=[ListNode(x) for x in arr_{i}]\n"
                f"            for k in range(n_{i}-1): nodes_{i}[k].next=nodes_{i}[k+1]\n"
                f"            if 0<=pos_{i}<n_{i}: nodes_{i}[-1].next=nodes_{i}[pos_{i}]\n"
                f"            {v}=nodes_{i}[0] if nodes_{i} else None\n")
    if p_type == "TreeNode*":
        ctx["treeRootVar"] = v
        return (f"            n_{i}=int(next(iterator))\n"
                f"            arr_{i}=[int(next(iterator)) for _ in range(n_{i})]\n"
                f"            {v}=None\n"
                f"            if n_{i}>0 and arr_{i}[0]!=-1:\n"
                f"                {v}=TreeNode(arr_{i}[0])\n"
                f"                bq_{i}=[ {v} ]\n"
                f"                idx_{i}=1\n"
                f"                while bq_{i} and idx_{i}<n_{i}:\n"
                f"                    nd=bq_{i}.pop(0)\n"
                f"                    if idx_{i}<n_{i} and arr_{i}[idx_{i}]!=-1:\n"
                f"                        nd.left=TreeNode(arr_{i}[idx_{i}])\n"
                f"                        bq_{i}.append(nd.left)\n"
                f"                    idx_{i}+=1\n"
                f"                    if idx_{i}<n_{i} and arr_{i}[idx_{i}]!=-1:\n"
                f"                        nd.right=TreeNode(arr_{i}[idx_{i}])\n"
                f"                        bq_{i}.append(nd.right)\n"
                f"                    idx_{i}+=1\n")
    if p_type == "TreeNode*->val":
        root = ctx.get("treeRootVar", "None")
        return (f"            {v}_val=int(next(iterator))\n"
                f"            {v}=None\n"
                f"            if {root}:\n"
                f"                fq=[ {root} ]\n"
                f"                while fq:\n"
                f"                    fn=fq.pop(0)\n"
                f"                    if fn.val=={v}_val: {v}=fn; break\n"
                f"                    if fn.left: fq.append(fn.left)\n"
                f"                    if fn.right: fq.append(fn.right)\n")
    if p_type == "Node*":
        return (f"            n_{i}=int(next(iterator))\n"
                f"            nodes_{i}=[Node(k+1) for k in range(n_{i})]\n"
                f"            for k in range(n_{i}):\n"
                f"                deg=int(next(iterator))\n"
                f"                for _ in range(deg):\n"
                f"                    nb=int(next(iterator))\n"
                f"                    nodes_{i}[k].neighbors.append(nodes_{i}[nb-1])\n"
                f"            {v}=nodes_{i}[0] if nodes_{i} else None\n")
    return f"            # [unsupported param type: {p_type}]\n"


def _py_return(ret_type: str, call: str, params: list) -> str:
    if ret_type == "void":
        fp = params[0] if params else {}
        fa = "param_0"
        print_code = "            print(1)\n"
        pt = fp.get("type", "")
        if pt == "vector<int>":
            print_code = f'            print(" ".join(map(str, {fa})))\n'
        elif pt == "vector<char>":
            print_code = f'            print(" ".join(str(ord(c)) for c in {fa}))\n'
        elif pt in ("vector<vector<int>>", "vector<vector<char>>"):
            print_code = f'            for row in {fa}: print(" ".join(str(ord(c)) if isinstance(c, str) else str(c) for c in row))\n'
        return f"            {call}\n" + print_code
    if ret_type == "void:board":
        return f"            {call}\n            print(1)\n"
    if ret_type == "bool":
        return f'            res={call}\n            print("1" if res else "0")\n'
    if ret_type == "int":
        return f"            res={call}\n            print(res)\n"
    if ret_type == "double":
        return f'            res={call}\n            print(f"{{res:.5f}}")\n'
    if ret_type == "string":
        return f"            res={call}\n            print(res)\n"
    if ret_type == "vector<int>":
        return f'            res={call}\n            print(" ".join(map(str, res)))\n'
    if ret_type == "vector<string>":
        return f'            res={call}\n            for s in res: print(s)\n'
    if ret_type == "vector<vector<int>>":
        return f'            res={call}\n            for row in res: print(" ".join(map(str, row)))\n'
    if ret_type in ("count:vector<vector<int>>", "count:vector<vector<string>>", "count:vector<string>", "count:vector<int>"):
        return f"            res={call}\n            print(len(res))\n"
    if ret_type == "ListNode*":
        return (f"            res={call}\n"
                f"            out_vals=[]; cur=res\n"
                f"            while cur:\n"
                f"                out_vals.append(str(cur.val))\n"
                f"                cur=cur.next\n"
                f"            print(' '.join(out_vals))\n")
    if ret_type == "ListNode*->val":
        return f"            res={call}\n            print(res.val if res else -1)\n"
    if ret_type in ("TreeNode*", "TreeNode*:raw"):
        return (f"            res={call}\n"
                f"            if not res: print()\n"
                f"            else:\n"
                f"                bq=[res]; out_vals=[]\n"
                f"                while bq:\n"
                f"                    nd=bq.pop(0)\n"
                f"                    out_vals.append(str(nd.val))\n"
                f"                    if nd.left: bq.append(nd.left)\n"
                f"                    if nd.right: bq.append(nd.right)\n"
                f"                print(' '.join(out_vals))\n")
    if ret_type == "TreeNode*->val":
        return f"            res={call}\n            print(res.val if res else -1)\n"
    if ret_type == "count:TreeNode*":
        return (f"            res={call}\n"
                f"            cnt=0; cq=[res] if res else []\n"
                f"            while cq:\n"
                f"                nd=cq.pop(0); cnt+=1\n"
                f"                if nd.left: cq.append(nd.left)\n"
                f"                if nd.right: cq.append(nd.right)\n"
                f"            print(cnt)\n")
    if ret_type == "int:cloneGraph":
        return (f"            cloned={call}\n"
                f"            if not cloned: print(0)\n"
                f"            else:\n"
                f"                visited=set(); bq=[cloned]\n"
                f"                while bq:\n"
                f"                    nd=bq.pop(0)\n"
                f"                    if nd in visited: continue\n"
                f"                    visited.add(nd)\n"
                f"                    for nb in nd.neighbors: bq.append(nb)\n"
                f"                print(len(visited))\n")
    if ret_type == "design:MinStack":
        return "            for x in param_0: solver.push(x)\n            print(solver.getMin())\n"
    if ret_type == "design:MyQueue":
        return "            for x in param_0: solver.push(x)\n            print(solver.peek())\n"
    if ret_type == "design:MyCircularQueue":
        return "            for x in param_0: solver.enQueue(x)\n            print(solver.Rear())\n"
    if ret_type == "design:MedianFinder":
        return '            for x in param_0: solver.addNum(x)\n            print(f"{solver.findMedian():.1f}")\n'
    if ret_type == "design:Codec":
        return "            enc = solver.encode(param_0)\n            dec = solver.decode(enc)\n            print(len(dec))\n"
    if ret_type == "design:CodecTree":
        return "            enc = solver.serialize(param_0)\n            dec = solver.deserialize(enc)\n            cnt=0; cq=[]; \n            if dec: cq.append(dec)\n            while cq: \n                nd=cq.pop(0); cnt+=1\n                if nd.left: cq.append(nd.left)\n                if nd.right: cq.append(nd.right)\n            print(cnt)\n"
    return f"            # [unsupported returnType: {ret_type}]\n"


# ── JavaScript Driver Generation ───────────────────────────────────────────────

def _js_param(p_type: str, v: str, i: int, ctx: dict) -> str:
    if p_type == "int":
        return f"        const {v}=parseInt(tokens[idx++],10);\n"
    if p_type == "bool":
        return f"        const {v}=(parseInt(tokens[idx++],10)!==0);\n"
    if p_type == "double":
        return f"        const {v}=parseFloat(tokens[idx++]);\n"
    if p_type == "string":
        return f"        let {v}=tokens[idx++]; if({v}==='@@EMPTY@@'){v}='';\n"
    if p_type == "string:line":
        return f"        let {v}=tokens[idx++]; {v}=({v}==='@@EMPTY@@')?'':{v}.replace(/_/g,' ');\n"
    if p_type == "vector<char>":
        return (f"        const n_{i}=parseInt(tokens[idx++],10);\n"
                f"        const {v}=[];\n"
                f"        for(let k=0;k<n_{i};k++){v}.push(String.fromCharCode(parseInt(tokens[idx++],10)));\n")
    if p_type == "vector<int>":
        return (f"        const n_{i}=parseInt(tokens[idx++],10);\n"
                f"        const {v}=[];\n"
                f"        for(let k=0;k<n_{i};k++){v}.push(parseInt(tokens[idx++],10));\n")
    if p_type == "vector<string>":
        return (f"        const n_{i}=parseInt(tokens[idx++],10);\n"
                f"        const {v}=[];\n"
                f"        for(let k=0;k<n_{i};k++){{let __t=tokens[idx++]; {v}.push(__t==='@@EMPTY@@'?'':__t);}}\n")
    if p_type == "vector<vector<int>>":
        return (f"        const rows_{i}=parseInt(tokens[idx++],10),cols_{i}=parseInt(tokens[idx++],10);\n"
                f"        const {v}=[];\n"
                f"        for(let r=0;r<rows_{i};r++){{{v}.push([]);for(let c=0;c<cols_{i};c++){v}[r].push(parseInt(tokens[idx++],10));}}\n")
    if p_type == "vector<vector<char>>":
        return (f"        const rows_{i}=parseInt(tokens[idx++],10),cols_{i}=parseInt(tokens[idx++],10);\n"
                f"        const {v}=[];\n"
                f"        for(let r=0;r<rows_{i};r++){{{v}.push([]);for(let c=0;c<cols_{i};c++){v}[r].push(String.fromCharCode(parseInt(tokens[idx++],10)));}}\n")
    if p_type == "ListNode*":
        return (f"        const n_{i}=parseInt(tokens[idx++],10);\n"
                f"        const dummy_{i}=new ListNode(0); let cur_{i}=dummy_{i};\n"
                f"        for(let k=0;k<n_{i};k++){{ cur_{i}.next=new ListNode(parseInt(tokens[idx++],10)); cur_{i}=cur_{i}.next; }}\n"
                f"        const {v}=dummy_{i}.next;\n")
    if p_type == "ListNode*:intersectA":
        ctx["intersectB"] = f"__intersectB_{i}"
        return (f"        const na_{i}=parseInt(tokens[idx++],10);\n"
                f"        const arrA_{i}=[]; for(let k=0;k<na_{i};k++)arrA_{i}.push(parseInt(tokens[idx++],10));\n"
                f"        const nb_{i}=parseInt(tokens[idx++],10);\n"
                f"        const arrB_{i}=[]; for(let k=0;k<nb_{i};k++)arrB_{i}.push(parseInt(tokens[idx++],10));\n"
                f"        const nc_{i}=parseInt(tokens[idx++],10);\n"
                f"        const arrC_{i}=[]; for(let k=0;k<nc_{i};k++)arrC_{i}.push(parseInt(tokens[idx++],10));\n"
                f"        const dC=new ListNode(0); let cC=dC;\n"
                f"        for(let x of arrC_{i}){{ cC.next=new ListNode(x); cC=cC.next; }}\n"
                f"        const tailHead_{i}=dC.next;\n"
                f"        const dA=new ListNode(0); let cA=dA;\n"
                f"        for(let x of arrA_{i}){{ cA.next=new ListNode(x); cA=cA.next; }}\n"
                f"        cA.next=tailHead_{i}; const {v}=dA.next;\n"
                f"        const dB=new ListNode(0); let cB=dB;\n"
                f"        for(let x of arrB_{i}){{ cB.next=new ListNode(x); cB=cB.next; }}\n"
                f"        cB.next=tailHead_{i}; const __intersectB_{i}=dB.next;\n")
    if p_type == "ListNode*:intersectB":
        return f"        const {v}={ctx.get('intersectB', 'null')};\n"
    if p_type == "vector<ListNode*>":
        return (f"        const num_lists_{i}=parseInt(tokens[idx++],10);\n"
                f"        const {v}=[];\n"
                f"        for(let L=0; L<num_lists_{i}; L++) {{\n"
                f"            const n_L = parseInt(tokens[idx++],10);\n"
                f"            const dummy = new ListNode(0); let cur = dummy;\n"
                f"            for(let k=0; k<n_L; k++) {{ cur.next = new ListNode(parseInt(tokens[idx++],10)); cur = cur.next; }}\n"
                f"            {v}.push(dummy.next);\n"
                f"        }}\n")
    if p_type == "ListNode*:cycle":
        return (f"        const n_{i}=parseInt(tokens[idx++],10);\n"
                f"        const arr_{i}=[]; for(let k=0;k<n_{i};k++)arr_{i}.push(parseInt(tokens[idx++],10));\n"
                f"        const pos_{i}=parseInt(tokens[idx++],10);\n"
                f"        const nodes_{i}=arr_{i}.map(x=>new ListNode(x));\n"
                f"        for(let k=0;k<n_{i}-1;k++)nodes_{i}[k].next=nodes_{i}[k+1];\n"
                f"        if(pos_{i}>=0&&pos_{i}<n_{i})nodes_{i}[n_{i}-1].next=nodes_{i}[pos_{i}];\n"
                f"        const {v}=nodes_{i}.length>0?nodes_{i}[0]:null;\n")
    if p_type == "TreeNode*":
        ctx["treeRootVar"] = v
        return (f"        const n_{i}=parseInt(tokens[idx++],10);\n"
                f"        const arr_{i}=[]; for(let k=0;k<n_{i};k++)arr_{i}.push(parseInt(tokens[idx++],10));\n"
                f"        let {v}=null;\n"
                f"        if(n_{i}>0&&arr_{i}[0]!==-1){{\n"
                f"            {v}=new TreeNode(arr_{i}[0]);\n"
                f"            const bq_{i}=[{v}];\n"
                f"            let idx_{i}=1;\n"
                f"            while(bq_{i}.length>0&&idx_{i}<n_{i}){{\n"
                f"                const nd=bq_{i}.shift();\n"
                f"                if(idx_{i}<n_{i}&&arr_{i}[idx_{i}]!==-1){{ nd.left=new TreeNode(arr_{i}[idx_{i}]); bq_{i}.push(nd.left); }} idx_{i}++;\n"
                f"                if(idx_{i}<n_{i}&&arr_{i}[idx_{i}]!==-1){{ nd.right=new TreeNode(arr_{i}[idx_{i}]); bq_{i}.push(nd.right); }} idx_{i}++;\n"
                f"            }}\n"
                f"        }}\n")
    if p_type == "TreeNode*->val":
        root = ctx.get("treeRootVar", "null")
        return (f"        const {v}_val=parseInt(tokens[idx++],10);\n"
                f"        let {v}=null;\n"
                f"        if({root}){{\n"
                f"            const fq=[{root}];\n"
                f"            while(fq.length>0){{\n"
                f"                const fn=fq.shift();\n"
                f"                if(fn.val==={v}_val){{ {v}=fn; break; }}\n"
                f"                if(fn.left)fq.push(fn.left); if(fn.right)fq.push(fn.right);\n"
                f"            }}\n"
                f"        }}\n")
    if p_type == "Node*":
        return (f"        const n_{i}=parseInt(tokens[idx++],10);\n"
                f"        const nodes_{i}=[];\n"
                f"        for(let k=0;k<n_{i};k++)nodes_{i}.push(new Node(k+1));\n"
                f"        for(let k=0;k<n_{i};k++){{\n"
                f"            const deg=parseInt(tokens[idx++],10);\n"
                f"            for(let j=0;j<deg;j++){{ const nb=parseInt(tokens[idx++],10); nodes_{i}[k].neighbors.push(nodes_{i}[nb-1]); }}\n"
                f"        }}\n"
                f"        const {v}=nodes_{i}.length>0?nodes_{i}[0]:null;\n")
    return f"        // [unsupported param type: {p_type}]\n"


def _js_return(ret_type: str, call: str, params: list) -> str:
    if ret_type == "void":
        fp = params[0] if params else {}
        fa = "param_0"
        print_code = "        console.log(1);\n"
        if fp.get("type") == "vector<int>":
            print_code = f"        console.log({fa}.join(' '));\n"
        return f"        {call};\n" + print_code
    if ret_type == "void:board":
        return f"        {call};\n        console.log(1);\n"
    if ret_type == "bool":
        return f"        const res={call};\n        console.log(res?'1':'0');\n"
    if ret_type == "int":
        return f"        const res={call};\n        console.log(res);\n"
    if ret_type == "double":
        return f"        const res={call};\n        console.log(res.toFixed(5));\n"
    if ret_type == "string":
        return f"        const res={call};\n        console.log(res);\n"
    if ret_type == "vector<int>":
        return f"        const res={call};\n        console.log(res.join(' '));\n"
    if ret_type == "vector<string>":
        return f"        const res={call};\n        for(const s of res)console.log(s);\n"
    if ret_type == "vector<vector<int>>":
        return f"        const res={call};\n        for(const row of res)console.log(row.join(' '));\n"
    if ret_type in ("count:vector<vector<int>>", "count:vector<vector<string>>", "count:vector<string>", "count:vector<int>"):
        return f"        const res={call};\n        console.log(res.length);\n"
    if ret_type == "ListNode*":
        return (f"        const res={call};\n"
                f"        const outVals=[]; let cur=res;\n"
                f"        while(cur){{ outVals.push(cur.val); cur=cur.next; }}\n"
                f"        console.log(outVals.join(' '));\n")
    if ret_type == "ListNode*->val":
        return f"        const res={call};\n        console.log(res?res.val:-1);\n"
    if ret_type in ("TreeNode*", "TreeNode*:raw"):
        return (f"        const res={call};\n"
                f"        if(!res){{ console.log(); }}else{{\n"
                f"            const bq=[res]; const outVals=[];\n"
                f"            while(bq.length>0){{\n"
                f"                const nd=bq.shift();\n"
                f"                outVals.push(nd.val);\n"
                f"                if(nd.left)bq.push(nd.left);\n"
                f"                if(nd.right)bq.push(nd.right);\n"
                f"            }}\n"
                f"            console.log(outVals.join(' '));\n"
                f"        }}\n")
    if ret_type == "TreeNode*->val":
        return f"        const res={call};\n        console.log(res?res.val:-1);\n"
    if ret_type == "count:TreeNode*":
        return (f"        const res={call};\n"
                f"        let cnt=0; const cq=res?[res]:[];\n"
                f"        while(cq.length>0){{\n"
                f"            const nd=cq.shift(); cnt++;\n"
                f"            if(nd.left)cq.push(nd.left); if(nd.right)cq.push(nd.right);\n"
                f"        }}\n"
                f"        console.log(cnt);\n")
    if ret_type == "int:cloneGraph":
        return (f"        const cloned={call};\n"
                f"        if(!cloned){{ console.log(0); }}else{{\n"
                f"            const visited=new Set();\n"
                f"            const bq=[cloned];\n"
                f"            while(bq.length>0){{\n"
                f"                const nd=bq.shift();\n"
                f"                if(visited.has(nd))continue; visited.add(nd);\n"
                f"                for(const nb of nd.neighbors)bq.push(nb);\n"
                f"            }}\n"
                f"            console.log(visited.size);\n"
                f"        }}\n")
    if ret_type == "design:MinStack":
        return "        for(let x of param_0) solver.push(x);\n        console.log(solver.getMin());\n"
    if ret_type == "design:MyQueue":
        return "        for(let x of param_0) solver.push(x);\n        console.log(solver.peek());\n"
    if ret_type == "design:MyCircularQueue":
        return "        for(let x of param_0) solver.enQueue(x);\n        console.log(solver.Rear());\n"
    if ret_type == "design:MedianFinder":
        return "        for(let x of param_0) solver.addNum(x);\n        console.log(solver.findMedian().toFixed(1));\n"
    if ret_type == "design:Codec":
        return "        const enc = solver.encode(param_0);\n        const dec = solver.decode(enc);\n        console.log(dec.length);\n"
    if ret_type == "design:CodecTree":
        return "        const enc = solver.serialize(param_0);\n        const dec = solver.deserialize(enc);\n        let cnt=0; const cq=[]; if(dec)cq.push(dec); while(cq.length>0){const nd=cq.shift(); cnt++; if(nd.left)cq.push(nd.left); if(nd.right)cq.push(nd.right);} console.log(cnt);\n"
    return f"        // [unsupported returnType: {ret_type}]\n"


# ── Main Entry Point ───────────────────────────────────────────────────────────

def build_backend_driver(
    user_code: str,
    q_meta: Dict[str, Any],
    lang: str,
    nonce: str,
) -> str:
    """
    Builds the authoritative, backend-controlled driver around user code.
    Markers are tagged with the server session nonce.
    """
    clean_code = clean_user_code(user_code, lang)
    params = q_meta.get("parameters", [])
    ret_type = q_meta.get("returnType", "int")
    func_name = q_meta.get("functionName", "solve")
    class_name = q_meta.get("className")
    constructor_args = q_meta.get("constructorArgs", [])

    c_args_str = ", ".join([f"param_{i}" for i in constructor_args]) if constructor_args else ""

    if lang == "cpp":
        ctx = {"treeRootVar": None, "needsNodeStruct": False}
        param_code = ""
        call_args = []
        for i, p in enumerate(params):
            var_name = f"param_{i}"
            call_args.append(var_name)
            param_code += _cpp_param(p.get("type", "int"), var_name, i, ctx)

        call_expr = f"solver.{func_name}({', '.join(call_args)})"
        print_code = _cpp_return(ret_type, call_expr, params)
        node_struct = ("\n" + CPP_GRAPH_NODE) if ctx.get("needsNodeStruct") else ""

        if class_name:
            solver_decl = f"            {class_name} solver({c_args_str});\n" if c_args_str else f"            {class_name} solver;\n"
        else:
            solver_decl = "            Solution solver;\n"

        return (
            f"{CPP_HEADERS}\n\n{CPP_LIST_NODE}\n\n{CPP_TREE_NODE}\n{node_struct}\n{clean_code}\n\n"
            f"int main() {{\n"
            f"    ios_base::sync_with_stdio(false);\n"
            f"    cin.tie(NULL);\n"
            f"    int T;\n"
            f"    if(cin>>T){{\n"
            f"        for(int _tc=0;_tc<T;++_tc){{\n"
            f'            cout<<"__AQ_{nonce}_START_"<<_tc<<"__\\n";\n'
            f"{param_code}"
            f"{solver_decl}"
            f"{print_code}"
            f'            cout<<"\\n__AQ_{nonce}_END_"<<_tc<<"__\\n";\n'
            f"        }}\n"
            f'        cout<<"__AQ_{nonce}_COMPLETED__\\n";\n'
            f"    }}\n"
            f"    return 0;\n"
            f"}}"
        )

    if lang == "java":
        ctx = {"treeRootVar": None}
        param_code = ""
        call_args = []
        for i, p in enumerate(params):
            var_name = f"param_{i}"
            call_args.append(var_name)
            param_code += _java_param(p.get("type", "int"), var_name, i, ctx)

        call_expr = f"solver.{func_name}({', '.join(call_args)})"
        print_code = _java_return(ret_type, call_expr, params)

        if class_name:
            solver_decl = f"                {class_name} solver = new {class_name}({c_args_str});\n" if c_args_str else f"                {class_name} solver = new {class_name}();\n"
        else:
            solver_decl = "                Solution solver = new Solution();\n"

        java_helpers = []
        if "class ListNode" not in clean_code:
            java_helpers.append(JAVA_LIST_NODE)
        if "class TreeNode" not in clean_code:
            java_helpers.append(JAVA_TREE_NODE)
        if "class Node" not in clean_code:
            java_helpers.append(JAVA_GRAPH_NODE)
        helpers_str = "\n\n".join(java_helpers)

        return (
            f"import java.util.*;\nimport java.io.*;\n\n{helpers_str}\n\n{clean_code}\n\n"
            f"public class Main {{\n"
            f"    public static void main(String[] args) throws Exception {{\n"
            f"        Scanner sc=new Scanner(System.in);\n"
            f"        if(sc.hasNextInt()){{\n"
            f"            int T=sc.nextInt();\n"
            f"            for(int _tc=0;_tc<T;++_tc){{\n"
            f'                System.out.println("__AQ_{nonce}_START_" + _tc + "__");\n'
            f"{param_code}"
            f"{solver_decl}"
            f"{print_code}"
            f'                System.out.println("\\n__AQ_{nonce}_END_" + _tc + "__");\n'
            f"            }}\n"
            f'            System.out.println("__AQ_{nonce}_COMPLETED__");\n'
            f"        }}\n"
            f"    }}\n"
            f"}}"
        )

    if lang == "python":
        ctx = {"treeRootVar": None}
        param_code = ""
        call_args = []
        for i, p in enumerate(params):
            var_name = f"param_{i}"
            call_args.append(var_name)
            param_code += _py_param(p.get("type", "int"), var_name, i, ctx)

        call_expr = f"solver.{func_name}({', '.join(call_args)})"
        print_code = _py_return(ret_type, call_expr, params)

        if class_name:
            solver_decl = f"            solver = {class_name}({c_args_str})\n" if c_args_str else f"            solver = {class_name}()\n"
        elif ret_type == "design:MyCircularQueue":
            solver_decl = "            solver = MyCircularQueue(param_1)\n"
        elif ret_type.startswith("design:"):
            cls_from_ret = ret_type.split(":", 1)[1]
            solver_decl = f"            solver = {cls_from_ret}() if '{cls_from_ret}' in globals() else (Solution() if 'Solution' in globals() else None)\n"
        else:
            solver_decl = f"            solver = Solution() if 'Solution' in globals() else type('Solver', (), {{'{func_name}': staticmethod({func_name})}})()\n"

        py_helpers = []
        if "class ListNode" not in clean_code:
            py_helpers.append(PY_LIST_NODE)
        if "class TreeNode" not in clean_code:
            py_helpers.append(PY_TREE_NODE)
        if "class Node" not in clean_code:
            py_helpers.append(PY_GRAPH_NODE)
        helpers_str = "\n\n".join(py_helpers)

        runner_fn = f"_aq_runner_{nonce}"
        return (
            f"import sys\nfrom typing import List, Optional\n\n{helpers_str}\n\n{clean_code}\n\n"
            f"def {runner_fn}():\n"
            f"    input_data=sys.stdin.read().split()\n"
            f"    if not input_data:return\n"
            f"    iterator=iter(input_data)\n"
            f"    try:\n"
            f"        T=int(next(iterator))\n"
            f"    except StopIteration:return\n"
            f"    for _tc in range(T):\n"
            f"        try:\n"
            f'            print(f"__AQ_{nonce}_START_{{_tc}}__")\n'
            f"{param_code}"
            f"{solver_decl}"
            f"{print_code}"
            f'            print(f"\\n__AQ_{nonce}_END_{{_tc}}__")\n'
            f"        except StopIteration:return\n"
            f'    print(f"__AQ_{nonce}_COMPLETED__")\n\n'
            f"if __name__=='__main__':\n"
            f"    {runner_fn}()\n"
        )

    if lang == "js":
        ctx = {"treeRootVar": None}
        param_code = ""
        call_args = []
        for i, p in enumerate(params):
            var_name = f"param_{i}"
            call_args.append(var_name)
            param_code += _js_param(p.get("type", "int"), var_name, i, ctx)

        call_expr = f"solver.{func_name}({', '.join(call_args)})"
        print_code = _js_return(ret_type, call_expr, params)

        if class_name:
            solver_decl = f"        const solver = new {class_name}({c_args_str});\n" if c_args_str else f"        const solver = new {class_name}();\n"
        else:
            solver_decl = f"        const solver = typeof Solution !== 'undefined' ? new Solution() : {{ {func_name} }};\n"

        js_helpers = []
        if "function ListNode" not in clean_code and "class ListNode" not in clean_code:
            js_helpers.append(JS_LIST_NODE)
        if "function TreeNode" not in clean_code and "class TreeNode" not in clean_code:
            js_helpers.append(JS_TREE_NODE)
        if "function Node" not in clean_code and "class Node" not in clean_code:
            js_helpers.append(JS_GRAPH_NODE)
        helpers_str = "\n\n".join(js_helpers)

        runner_fn = f"_aq_runner_{nonce}"
        return (
            f"const fs=require('fs');\n\n{helpers_str}\n\n{clean_code}\n\n"
            f"function {runner_fn}(){{\n"
            f"    const input=fs.readFileSync(0,'utf-8');\n"
            f"    const tokens=input.trim().split(/\\s+/);\n"
            f"    if(!tokens.length||tokens[0]===\"\")return;\n"
            f"    let idx=0;\n"
            f"    const T=parseInt(tokens[idx++],10);\n"
            f"    for(let _tc=0;_tc<T;++_tc){{\n"
            f"        if(idx>=tokens.length)break;\n"
            f'        console.log(`__AQ_{nonce}_START_${{_tc}}__`);\n'
            f"{param_code}"
            f"{solver_decl}"
            f"{print_code}"
            f'        console.log(`\\n__AQ_{nonce}_END_${{_tc}}__`);\n'
            f"    }}\n"
            f'    console.log(`__AQ_{nonce}_COMPLETED__`);\n'
            f"}}\n\n{runner_fn}();"
        )

    return clean_code
