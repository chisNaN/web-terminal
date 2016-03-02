function semilogy(varargin)
  %semilogy plots data with logarithmic scale for the y-axis.
  %
  %semilogy(Y) creates a plot using a base 10 logarithmic scale for the y-axis and a linear scale for the x-axis. It plots the columns of Y versus their index if Y contains real numbers. semilogy(Y) is equivalent to semilogy(real(Y), imag(Y)) if Y contains complex numbers. semilogy ignores the imaginary component in all other uses of this function.
  %
  %semilogy(X1,Y1,...) plots all Xn versus Yn pairs. If only Xn or Yn is a matrix, semilogy plots the vector argument versus the rows or columns of the matrix, along the dimension of the matrix whose length matches the length of the vector. If the matrix is square, its columns plot against the vector if their lengths match.
  %
  %semilogy(X1,Y1,LineSpec,...) plots all lines defined by the Xn,Yn,LineSpec triples. LineSpec determines line style, marker symbol, and color of the plotted lines.
  %
  %semilogy(...,'PropertyName',PropertyValue,...) sets property values for all lineseries properties graphics objects created by semilogy.
  %
  %h = semilogy(...) returns a vector of handles to lineseries graphics objects, one handle per line.
   
  plot(varargin{:}, 'logy', 'true');
end
