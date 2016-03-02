//============================================================================
// Name        : Douglas.cpp
// Author      : Varun Ganapathi
// Version     :
// Copyright   : Copyright Cloudlabs Inc.
// Description : Hello World in C++, Ansi-style
//============================================================================


#include <iostream>
#include <fstream>
#include <vector>
#include <algorithm>
#include <stack>
#include <deque>
#include "Eigen/Core"
using namespace std;
using namespace Eigen;


typedef Vector2d Point;
typedef Vector3d PointEpsilon;
typedef Point::Scalar Real;


#define CHECK(x) if(!x) { fprintf(stdout, "ERROR: %s: %d", __FILE__, __LINE__); exit(-1); }

double PerpindicularDistance(const Point& p, const Point& a, const Point& b) {
	// return the distance between p and the line formed by line0,line1
	Point n = (b-a).normalized();
//out << "p:" << p << endl;
//out << "a:" << a << endl;
//out << "b:" << b << endl;
	Point delta = (p-a).dot(n)*n;
	Point closest = a+delta;
//out << "closest: " << closest << endl;
	return (p-closest).squaredNorm();
}

inline double sqr(double a) { return a*a; }

struct Line {
	Point n, a, b;
	Line(const Point& a, const Point& b)  : n( (b-a).normalized() ), a(a), b(b) {}
	double Distance(const Point& p) const {
		Point d = p-a;
		return (d-(d.dot(n)*n)).squaredNorm();
	}
};


struct FastLine {
  // convert to ax + by + c and then use that
  Point lin;
  double c, inv_squared_norm;
  inline FastLine(const Point& a, const Point& b) {
    Point delta = b-a;
    lin = Point(delta.y(), -delta.x());
    c = -lin.dot(a);
    inv_squared_norm = 1.0/lin.squaredNorm();
  }
  inline double Distance(const Point& p) const {
    return inv_squared_norm*sqr(lin.dot(p) + c);
  }
};

struct FastLine2 {
  // convert to ax + by + c and then use that
  Point lin;
  double c;
  inline FastLine2(const Point& a, const Point& b) {
    Point delta = b-a;
    lin = Point(delta.y(), -delta.x()).normalized(); // pays one square root here
    c = -lin.dot(a);
  }
  inline double Distance(const Point& p) const {
    return sqr(lin.dot(p) + c); // saves multiplies here
  }
};

/*
 * V1: dumbly just repeats computation for each epsilon. smart way would not do that.
 * start is included in the list and end is not included
 * adds all points that it picks recursively
 */
void DouglasPeucker(double epsilonSquared, const vector<Point>& points, int start, int end, vector<Point>& added_points ) {
	//cout << "Douglas: [" << start << "," << (end-1) << "]" << endl;
	if((end-start) < 3) return; // start and end-1 are in the set, so we need at least one more to do anything (which would be to just add it directly in) and then not do anything
	// produce points ordered by epsilon. store epsilon as z()
	double dmax = 0;
	int index = start;
	for(int i = start+1; i<end-1; ++i) {
		double d = PerpindicularDistance(points[i], points[start], points[end-1]);
//		cout << "Dist between " << i << " and " << start << " " << end-1 << " = " << d << " compared to " << epsilonSquared << endl;
		if(d > dmax) {
			index = i;
			dmax = d;
//			cout << "updated to " << index << endl;
		}
	}
	if ((dmax >= epsilonSquared) && (index!=start)) {
//		cout << "picked:" << index << " for " << dmax << endl;
		added_points.push_back(points[index]);
		DouglasPeucker(epsilonSquared, points, start, index+1, added_points);
		DouglasPeucker(epsilonSquared, points, index, end, added_points);
	}
}

void DouglasPeucker(double epsilon, const vector<Point>& points, vector<Point>& added_points ) {
	added_points.push_back(points.front());
	added_points.push_back(points.back());
	DouglasPeucker(epsilon*epsilon, points, 0, points.size(), added_points);
}



// TODO: use explicit stack
void DouglasPeuckerWithEpsilon(double epsilonSquared, const vector<Point>& points, int start, int end, vector<PointEpsilon>& added_points ) {
//	cerr << "Douglas: [" << start << "," << (end-1) << "]" << endl;

	if((end-start) < 3) {
		return; // start and end-1 are in the set, so we need at least one more to do anything (which would be to just add it directly in) and then not do anything
	}
	// produce points ordered by epsilon. store epsilon as z()
	double dmax = 0;
	int index = start;

	//Line line(points[start], points[end-1]);
  FastLine line(points[start], points[end-1]);
	for(int i = start+1; i<end-1; ++i) {
		// precompute what is needed here for computing distance to speed up
		double d = line.Distance(points[i]);
//		cout << "Dist between " << i << " and " << start << " " << end-1 << " = " << d << " compared to " << epsilonSquared << endl;
		if(d > dmax) {
			index = i;
			dmax = d;
//			cout << "updated to " << index << endl;
		}
	}
	if ((dmax >= epsilonSquared) && (index!=start)) {
		//cerr << "picked:" << index << " for " << dmax << endl;
		added_points.push_back(PointEpsilon(points[index][0],points[index][1], sqrt(dmax)));
		DouglasPeuckerWithEpsilon(epsilonSquared, points, start, index+1, added_points);
		DouglasPeuckerWithEpsilon(epsilonSquared, points, index, end, added_points);
	}
}
void DouglasPeuckerWithEpsilon(double epsilon, const vector<Point>& points, vector<PointEpsilon>& added_points ) {
	added_points.push_back(PointEpsilon(points.front()[0],points.front()[1], 1e10));
	added_points.push_back(PointEpsilon(points.back()[0],points.back()[1], 1e10));
	DouglasPeuckerWithEpsilon(epsilon*epsilon, points, 0, points.size(), added_points);
}
PointEpsilon Epsify(const Point& p, double eps) {
	return PointEpsilon(p[0],p[1],eps);
}

struct State {
	int start, end;
	State(int s, int e) : start(s), end(e) {}
};

void DouglasPeuckerWithEpsilonStack(double epsilonSquared, const vector<Point>& points, vector<PointEpsilon>& added_points ) {
	//cout << "Stack" << endl;
	added_points.reserve(points.size());
	added_points.push_back(Epsify(points.front(), 1e10));
	added_points.push_back(Epsify(points.back(), 1e10));

	stack<State> states;
	states.push(State(0,points.size()));
  int count = 0;
	while(!states.empty())
	{
    count ++;
    if ((count  %  10000) == 0) {
      //cout << count << endl;
    }
     //cout << "GOT IN THE LOOP "  << epsilonSquared << endl;
//		cout << "Num States:" << states.size() << endl;
		// pop the state
		State cur = states.top();
		states.pop();
		// process the state
		// change min amount
		if( (cur.end - cur.start) < 3 ) { continue; }
		else {
			int index = cur.start;
			double dmax = 0;
			//Line line(points[cur.start], points[cur.end-1]);
      FastLine fastline(points[cur.start], points[cur.end-1]);

			int min_i=cur.start+1, max_i = cur.end-1;
			int n = cur.end-cur.start;
			if(n > 50000) {
				min_i += n/4;
				max_i -= n/4;
			}
			for(int i = min_i; i<max_i; ++i) {
				// precompute what is needed here for computing distance to speed up
				double d = fastline.Distance(points[i]);
                //if( abs(fastline.Distance(points[i]) -d) > 1e-8) { cerr << "wtf" << endl; }
				if(d > dmax) {
					index = i;
					dmax = d;
				}
			}
			if ((dmax >= epsilonSquared) && (index!=cur.start)) {
//				cerr << "picked:" << index << " for " << dmax << endl;
				added_points.push_back(PointEpsilon(points[index][0],points[index][1], sqrt(dmax)));
				states.push(State(cur.start,index+1));
				states.push(State(index, cur.end));
			}
		}
	}
  //cout << "WHEEEEEE" << endl;
}

struct SortVecByZ {
	  bool operator()(const PointEpsilon& a, const PointEpsilon& b) const { return (a[2] > b[2]); }
 };

struct SortVecByX {
  bool operator()(const Point& a, const Point& b) const { return a[0] < b[0]; }
  bool operator()(const PointEpsilon& a, const PointEpsilon& b) const { return (a[0] < b[0]); }
};

ostream& operator<<(ostream& os, vector<Point>& points) {
	os << "[" << endl;
	for(int i=0; i<points.size(); ++i) {
		os << points[i][0] << " " << points[i][1] << endl;
	}
	os << "];";
	return os;
}

ostream& operator<<(ostream& os, vector<PointEpsilon>& points) {
	os << "[" << endl;
	for(int i=0; i<points.size(); ++i) {
		os << points[i][0] << " " << points[i][1] << " " << points[i][2] << endl;
	}
	os << "];";
	return os;
}


struct Pyramid {
  vector<PointEpsilon>* points;

  struct Slice {
    int slice_id;
    Real xmin, xmax;         // actual min and max of data here
    int start_index, end_index; // empty means start_index == end_index
    bool empty() { return end_index <= start_index; }
    int num_points() { return empty()?0:(end_index-start_index); }
    Slice(int slice_id, Real xmin, Real xmax, int start_index, int end_index ) 
      : slice_id(slice_id),
        xmin(xmin),
        xmax(xmax),
        start_index(start_index),
        end_index(end_index) 
    {}
  };
  
  struct Level {
    // maximum error in this level: epsilon < (xmax-xmin)/level_width_pixels 
    Real epsilon; 
    // range of points corresponding to this level
    int max_index_; // includes points from previous level until and not including max_index_
    vector<Slice> slices_;
    Level(Real eps, int max_index) : epsilon(eps), max_index_(max_index){}
  };
  
  vector<Level> levels_;
  Real base_epsilon;
  
  int w, h, k, a;
  Real ymin, ymax, xmin, xmax;
  Real padding;
  
  Pyramid() {
    a = 2;
    w = 512;
    h = 512;
    k = 8; // make sure w pixels corrsesponds to k slices, so overlapping by one means k+1 slices to be dled
    padding = 1;
  }
  
  // assumes data sorted by epsilon
  // modifies data and stores it
  void Construct(vector<PointEpsilon>* input) {
    assert(input);
    points = input;
    vector<PointEpsilon>& data = *points;
    
    xmax = xmin = data[0].x();
    ymax = ymin = data[0].y();
    for(int i=0; i<data.size(); ++i){
      xmax = max(data[i].x(), xmax);
      xmin = min(data[i].x(), xmin);
      ymax = max(data[i].y(), ymax);
      ymin = min(data[i].y(), ymin);
    }
    
    base_epsilon = min( (xmax-xmin)/w, (ymax-ymin)/h) / padding;
    //printf("%10f\n", base_epsilon);
    //cerr << "base_epsilon:" << base_epsilon << endl;
    Real epsilon = base_epsilon;  // min size of pixel in coordinates, with some padding
    //cerr << "Initial epsilon: " << epsilon << endl;
    
    // choose data for first level. (try to unify to not be special case.)
    for (int i=0; i<data.size(); ++i) {
      if (data[i].z() < epsilon) {
        k++; // one more level
        //cout << "Level:" << i << " " << epsilon << endl;
        levels_.push_back(Level(epsilon, i));
        epsilon /= 2;
      }
    }
    Level l(epsilon, data.size());
    levels_.push_back(l);
    
    // sort points within each level by x
    int prev_start = 0;
    for (int i=0; i<levels_.size(); ++i) {
      sort(data.begin()+prev_start, data.begin()+levels_[i].max_index_, SortVecByX());
      prev_start = levels_[i].max_index_;
    }
    
    // now output each level split into slices 
    for (int i=0; i<levels_.size(); ++i){
      //cout << i << ": epsilon: " << levels_[i].epsilon << ", max_index_: "  << levels_[i].max_index_ << endl;
    }
  

    // output level 0
    //cout << "output level 0" << endl;
    int num_slices = 8;

    int start_index = levels_[0].max_index_;
    
    // level 0 is special.
    levels_[0].slices_.push_back(Slice(0, xmin, xmax, 0, levels_[0].max_index_));

    for(int i=1; i<levels_.size(); ++i) {
      vector<Slice>& slices = levels_[i].slices_;
      Real slice_width = (xmax-xmin)/num_slices;
      int end_index = levels_[i].max_index_;
      // find non-empty slices
      // cout << num_slices << " ?= " << (xmax-xmin)/slice_width << endl;
      int last_slice_id = -1;
      for(int j=start_index; j<end_index; ++j) {
        // slice_id is virtually where this slice would be in all possible slices
        int slice_id = (data[j].x()-xmin)/slice_width;
        if (slice_id != last_slice_id) {
          // create a new slice: contains just this point
          Slice s(slice_id, data[j].x(), data[j].x(), j, j+1);
          slices.push_back(s);
          // push it onto the thing
          last_slice_id = slice_id;
        } else {
          // update info in slice. new xmax and end_index
          slices.back().xmax = data[j].x();
          slices.back().end_index=j+1; // update it to include this point
        }
      }
            
      // cout << "slice\tslice_id\txmin\txmax\tnum_points\tstart\tend\t"<< endl; 
      for(int j=0; j<slices.size(); ++j){
        Slice& s = slices[j];
        // cout << j << "\t" << s.slice_id << "\t" << s.xmin << "\t" << s.xmax  << "\t" << s.num_points() << "\t" << s.start_index << "\t" << s.end_index  << endl; 
      }      
      start_index = end_index; // start from last end
      num_slices*=2; // each subsequent level has twice as many slices
    }
   

  }
  void Compress(int max_pull_up, int min_slice ) {
    // compress pyramid: merge child slices into parent up to some maximum amount, and delete the children. thisis tricky because it means moving points around
    // easier to implement if we just copy data around  
  }
  
  void SimulatePlot(Real des_eps, Real xlo, Real xhi) {
    // print out all leves/slices that need to be pulled for this graph
    // cout << "des_eps: " << des_eps << endl;
    // find first level where eps < des_eps
    // starting from root level, append all slice sthat intersect [xlo,xhi]
    // root-level -> use all data
    // cout << "level: 0 slices: [0]" << endl;
    for(int i=1; i<levels_.size(); ++i){
      // cout << "level: " << i << " slices: [";
      // allways process the level
      vector<Slice>& slices = levels_[i].slices_;
      for(int j=0; j<slices.size(); ++j){
        if(slices[j].xmin > xhi || slices[j].xmax < xlo) continue;
        // otherwise it intersects (why: it either is on the left or the right if it doesn't intersect
        // we test both cases
        // cout << j << ",";
      }
      // cout << "]" << endl;
      
      if(levels_[i].epsilon < des_eps) {
        // cout << "breaking: " << levels_[i].epsilon << endl;
        break;
        // don't process the next level below the first level that has a small enough eps
      }
    }
  }
  
  // make a faster simulate plot that doesn't require the indexg
  
  void Save(const char* folder) {
    // index.js : xmin, xmax, epsilon
    char buff[1024];
    sprintf(buff, "%s/index.js", folder);
    
    FILE* f = fopen(buff, "w");
    CHECK(f);
    //cerr << base_epsilon << endl;
    fprintf(f, "{ \"xmin\": %.15le, \"xmax\": %.15le, \"ymin\": %.15le, \"ymax\": %.15le, \"epsilon\": %.15le }\n", xmin, xmax, ymin, ymax, base_epsilon);
    fclose(f);

    // iterate through all levels/slice combos and output them
    for(int i=0; i<levels_.size(); ++i) {
      vector<Slice>& slices = levels_[i].slices_;
      for(int j=0; j<slices.size(); ++j) {
        Slice& sj = slices[j];
        if(sj.num_points() < 2) continue;
        sprintf(buff, "%s/slice_%d_%d.js", folder, i, sj.slice_id);
        f = fopen(buff, "w");
        // TODO: switch from JSONP to binary typed array = much smaller
        fprintf(f, "{\"level\":%d, \"slice_id\":%d, \"xmin\":%.8f, \"xmax\":%.8f, \"num_points\":%d, \"data_xy\": [\n", i, sj.slice_id, sj.xmin, sj.xmax, sj.num_points());
        // output numbers in this slice, x, y in pairs
        // cerr << sj.start_index << " : " << sj.end_index << " < ? " << points->size() << endl;
        CHECK( (sj.start_index >= 0) && (sj.end_index < points->size()));
        
        for(int k=sj.start_index; k<sj.end_index; ++k) {
          PointEpsilon& pe = (*points)[k];
          if(k!=sj.start_index) fprintf(f,",");
          fprintf(f, "%.8f,%.8f\n", pe.x(), pe.y());
        }
        fprintf(f, "]}\n");
        fclose(f);
      }
    }
    sprintf(buff, "%s/done", folder);
    f = fopen(buff, "w");
    fclose(f);
  }
};

int main(int argc, char* argv[]) {

  //std::vector<Point> points;
  //int numPoints = 100000;
  //double PI = 3.14159265;
  //double x, y;
  //for (int i = 0; i < numPoints; i++)
  //{
  //    x = i / (numPoints + 0.0);
  //    y =  (cos(i * PI / numPoints) + sin(i * i * PI / (100.0 * numPoints))) / 10.0 + 0.5;
  //    //y =  (cos(i * 100 * PI / numPoints)); //+ sin(i * i * PI / (100.0 * numPoints))) / 10.0 + 0.5;
  //    //y = x*5;
  //    points.push_back(Point(x, y));
  //}
  if(argc < 5 ) { 
    fprintf(stdout, "usage: output_folder num_points input_file_x input_file_y (binary)\n");
    return -1;
  }

  //fprintf(stdout, "arguments: %s %s %s %s\n", argv[1], argv[2], argv[3], argv[4]);

  int num_points = 0;
  istringstream iss(argv[2]); 
  iss >> num_points;
  cout << "num points = " << num_points << endl;
  vector<Point> points(num_points);
  {
    FILE* f = fopen(argv[3], "rb");
    vector<double> stuff(num_points);
    int num_read_points = fread(&stuff[0], sizeof(double),  num_points, f);
    if(num_points != num_read_points) {
      fprintf(stdout, "file ended early: expected %d but read %d points.", num_points, num_read_points);
      return 0;
    }
    fclose(f);

    for(int i=0; i<num_points; ++i) {
      points[i][0] = stuff[i];
    }

    f = fopen(argv[4], "rb");
    num_read_points = fread(&stuff[0], sizeof(double),  num_points, f);
    if(num_points != num_read_points) {
      fprintf(stdout, "file ended early: expected %d but read %d points.", num_points, num_read_points);
      return 0;
    }
    fclose(f);

    for(int i=0; i<num_points; ++i) {
      points[i][1] = stuff[i];
    }
  }

  vector<PointEpsilon> result;

  cout << "Creating data structure... ";
  DouglasPeuckerWithEpsilonStack(0, points, result);

  sort(result.begin(), result.end(), SortVecByZ());
  //for(int i=0; i<result.size(); ++i){
  //  if(result[i].z() < 1e-5) {
  //    cerr << "Ith answer: " << i << " :[" << result[i] << "]" << endl;
  //    break;
  //  }
  //}
  
  Pyramid pyramid;
  pyramid.Construct(&result);
  cout << "Done!" << endl;

  cout << "Loading to server. ";
  cout << "Your plot may be inexact in the meantime... ";

  // TODO: change from tmp
  string public_plot_folder = "/tmp/";
  string plot_folder = public_plot_folder + argv[1];
	string cmd = "mkdir -p " + plot_folder;
  system((cmd).c_str());
  pyramid.Save(plot_folder.c_str());
  cout << "Done!" << endl;

  //cout << "=================" << endl;
  //pyramid.SimulatePlot(.5, .6, 4096);
  
  
  //ofstream ofs("/home/varung/data.m");
  //ofs << "x ="  << points << endl;
  //ofs << "y = " << result << endl;

  //RangeTreeServer server(points);
  //int dump_depth = 15;
  //int dump_interval = 8;
  //server.dumpAll(dump_depth, dump_interval); // depth
}








// basic data structure:
//  1  
//  8  
//  16  
//  32
// ...

// of these only a subset are actually present.
// what is the access pattern?
// recursive: range, epsilon -> subrange, subepsilon
// how to know which ones are on? maybe don't. just ask and receive what is there?


