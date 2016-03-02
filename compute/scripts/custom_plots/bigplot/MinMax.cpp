//============================================================================
// Name        : MinMax.cpp
// Author      : Jeffrey Wu, Varun Ganapathi
// Version     :
// Copyright   : Copyright Cloudlabs Inc.
// Description : Bigplot server
//============================================================================

#include <iostream>
#include <cstdlib>
#include <fstream>
#include <vector>
#include <sstream> 
#include <algorithm>
#include <time.h>

#include <sys/stat.h>

using namespace std;

#define CHECK(x) if(!x) { fprintf(stdout, "ERROR: %s: %d", __FILE__, __LINE__); exit(-1); }

int find_index(const vector<double>& xs, double x) {
  int imin = 0;
  int imax = xs.size();
  int imid;
  // first tries to find last index strictly smaller
  while ( (imax - imin) > 1 ) {
    imid = (imin + imax) / 2;
    if (xs[imid] < x) {
      imin = imid;
    } else { // xs[imid] >= x
      imax = imid;
    }
  }
  while ((xs[imin] < x) && (imin < (xs.size()-1))) {
    imin++;
  }
  return imin;
}

// right-leaning binary search; finds last index at most as big
int find_index_high(const vector<double>& xs, int x) {
  int imin = 0;
  int imax = xs.size();
  int imid;
  // first tries to find first index strictly larger
  while (imax - imin > 1) {
    imid = (imin + imax) / 2;
    if (xs[imid] <= x) {
      imin = imid;
    } else { // xs[imid] > x
      imax = imid;
    }
  }
  return imin;
}

int main(int argc, char* argv[]) {
  // TODO: change from tmp
  string str_folder = argv[1];
  string cmd = "mkdir -p " + str_folder;
  system((cmd).c_str());

  char *folder;
  folder=&str_folder[0];

  long n;
  //fprintf(stdout, "arguments: %s %s %s\n", argv[1], argv[2], argv[3]);

  if(argc < 4 ) { 
    fprintf(stdout, "usage: output_folder input_file_x input_file_y\n");
    return -1;
  }

  
  struct stat st;
  stat(argv[2], &st);
  long size_x = st.st_size / sizeof(double);

  stat(argv[3], &st);
  long size_y = st.st_size / sizeof(double);

  if(size_x != size_y ) {
    fprintf(stdout, "Mismatched dimensions: %d x points, but %d y points.", size_x, size_y);
    return 0;
  }

  n = size_x;

  FILE* f = fopen(argv[2], "rb");
  vector<double> xs(n);
  int num_read_points = fread(&xs[0], sizeof(double), n, f);
  fclose(f);

  f = fopen(argv[3], "rb");
  vector<double> ys(n);
  int num_read_points2 = fread(&ys[0], sizeof(double),  n, f);
  fclose(f);

  if((num_read_points != num_read_points2) || (n != num_read_points) ) {
    fprintf(stdout, "Mismatched dimensions: %d x points, but %d y points and expected %d.", num_read_points, num_read_points2, n);
    return 0;
  }

  int slice_size = 1024; // buckets per slice
  int auto_slice_size = slice_size * 4; // cut off if less just keep all
  int branch_factor = 8; // number of children per slice
  
  cout << "Creating data structure.  Your plot will begin to appear as it is processed." << endl;
  
  time_t start_time = time(NULL);

  time_t start_write_time;
  time_t end_write_time;
  double write_time = 0;

  int num_points = 0;
  int num_slices = 0;
  
  double xmin = xs[0];
  double xmax = xs[n-1];
  
  char buff[1024];
  sprintf(buff, "%s/index.js", folder);
  f = fopen(buff, "w");
  CHECK(f);
  fprintf(f, "{ \"xmin\": %.15le, \"xmax\": %.15le}\n", xmin, xmax);
  fclose(f);
  
  int level = 0;
  vector<int> slices;
  slices.push_back(0);
  int num_slices_in_level = 1;
  bool exists_section_with_multiple = false; // whether we will split into children

  while (slices.size() > 0) {
    vector<int> next_level_slices;
    for (vector<int>::iterator it = slices.begin() ; it != slices.end(); ++it) {
      int slice_j = *it;
      num_slices ++;
      if (num_slices % 1000 == 0) {
        fprintf(stdout, "\n%d slices:  level=%d, slice=%d out of %d", num_slices, level, slice_j, num_slices_in_level);
      }
  
      double slice_length = (xmax - xmin) / num_slices_in_level;
      double minx = xmin + slice_length * slice_j;
      double maxx = xmin + slice_length * (slice_j + 1);
  
      vector<int> cur_slice;
    
      // finds first item >= minx or end
      int start = lower_bound(xs.begin(), xs.end(), minx)-xs.begin(); 
      // finds first item > maxx or end.
      int end = upper_bound(xs.begin(), xs.end(), maxx) - xs.begin();
      
      if ((end - start) < auto_slice_size) {
        for (int i = start; i < end; ++i) {
          cur_slice.push_back(i);
        }
        exists_section_with_multiple = false;
      } else {
        double interval_length = slice_length / slice_size;
        exists_section_with_multiple = true;

        // iterate through buckets
        // partition [start, end) into slice_size buckets of size interval_length
        for (int i = 0; i < slice_size; ++i) {
          double interval_min = minx + i * interval_length;
          double interval_max = minx + (i + 1) * interval_length;
          auto left_iter = lower_bound(xs.begin()+start, xs.begin()+end, interval_min);
          auto right_iter = upper_bound(xs.begin()+start, xs.begin()+end, interval_max);
          auto result = std::minmax_element(left_iter, right_iter);
          // add unique indices in sorted order to cur_slice
          vector<int> items;
          items.push_back(left_iter-xs.begin());
          items.push_back(right_iter-xs.begin() - 1);
          items.push_back(result.first-xs.begin());
          items.push_back(result.second-xs.begin());
          sort(items.begin(), items.end());
          auto last = unique(items.begin(), items.end());
          cur_slice.insert(cur_slice.end(), items.begin(), last);
        }
      }
  
      if (cur_slice.size() == 0) { continue;}
      if (exists_section_with_multiple) { // I'm not a leaf!
        for (int i = 0; i < branch_factor; ++i) {
          int new_slice_j = slice_j * branch_factor + i;
          next_level_slices.push_back(new_slice_j);
        }
      }
      num_points += cur_slice.size();

      sprintf(buff, "%s/slice_%d_%d.js", folder, level, slice_j);
      f = fopen(buff, "w");
      CHECK(f);
      start_write_time = time(NULL);

  
      fprintf(f, "{\"level\": %d, \"slice_id\": %d, \"num_points\": %d, \"is_leaf\": %s, \"xs\": [", level, slice_j, cur_slice.size(), (exists_section_with_multiple ?"false":"true"));
      
      fprintf(f, "%f", xs[cur_slice[0]]);
      for(int iti=1; iti<cur_slice.size(); ++iti) {
        fprintf(f, ",%f", xs[cur_slice[iti]]);
      }

      fprintf(f, "], \"ys\": [");

      fprintf(f, "%f", ys[cur_slice[0]]);
      for(int iti=1; iti<cur_slice.size(); ++iti) {
        fprintf(f, ",%f", ys[cur_slice[iti]]);
      }

      fprintf(f, "]}");
      fclose(f);
      end_write_time = time(NULL);

      write_time += difftime(end_write_time,start_write_time);
    }

    level ++;
    num_slices_in_level *= branch_factor;
    slices = next_level_slices;
  }

  sprintf(buff, "%s/done", folder);
  f = fopen(buff, "w");
  CHECK(f);
  fprintf(f, "done");
  fclose(f);

  fprintf(stdout, "\nBIGPLOT DONE!  %d slices, %d points (originally %d)\n", num_slices, num_points, n);

  time_t end_time = time(NULL);
  double seconds_elapsed = difftime(end_time, start_time);
  fprintf(stdout, "%.f seconds taken (%.f writing)\n", seconds_elapsed, write_time);
  
}
